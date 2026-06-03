using System;
using System.Diagnostics;
using System.Text;
using System.Threading.Tasks;

namespace ContextPicker
{
    /// <summary>Request for the "scan" mode of the bridge.</summary>
    public sealed class ScanRequest
    {
        public string RootDir { get; set; } = "";
        public string[] IncludedFiles { get; set; } = Array.Empty<string>();
        public bool IncludeEnvFiles { get; set; }
        public bool StripComments { get; set; }
        public bool RemoveBlankLines { get; set; }
    }

    /// <summary>Result of the bridge "count" mode: the size the scan would produce.</summary>
    public struct ScanCount
    {
        public int Lines;
        public int Chars;
    }

    /// <summary>
    /// Invokes the bundled Node CLI (scan-selection.js) to reuse the
    /// directory-scanner core (including comment-bear). Three modes:
    /// scan (files -> formatted contents), tree (JSON listing for the checkbox
    /// UI), skeleton (project tree as text). Dependency-free and hand-rolled JSON
    /// so it compiles on .NET Framework 4.7.2 (the VSIX) and modern .NET.
    /// </summary>
    public static class NodeBridge
    {
        /// <summary>files -> formatted contents.</summary>
        public static Task<string> ScanAsync(string nodeExe, string scriptPath, ScanRequest request)
            => RunAsync(nodeExe, scriptPath, ScanJson("scan", request));

        /// <summary>files -> the size the scan would produce (lines + chars), for a live counter.</summary>
        public static async Task<ScanCount> CountAsync(string nodeExe, string scriptPath, ScanRequest request)
        {
            string outp = await RunAsync(nodeExe, scriptPath, ScanJson("count", request)).ConfigureAwait(false);
            int tab = outp.IndexOf('\t');
            int lines = 0, chars = 0;
            if (tab > 0)
            {
                int.TryParse(outp.Substring(0, tab).Trim(), out lines);
                int.TryParse(outp.Substring(tab + 1).Trim(), out chars);
            }
            return new ScanCount { Lines = lines, Chars = chars };
        }

        /// <summary>
        /// root -> a flat, pre-order listing of the workspace for the checkbox UI.
        /// Each line is "D\t&lt;absPath&gt;" (directory) or "F\t&lt;absPath&gt;" (file); a
        /// parent always precedes its children, so the host can rebuild the tree
        /// with zero dependencies. node_modules/.git and .gitignore matches are excluded.
        /// </summary>
        public static Task<string> TreeAsync(string nodeExe, string scriptPath, string rootDir, bool respectGitignore)
            => RunAsync(nodeExe, scriptPath, ModeJson("tree", rootDir, respectGitignore));

        /// <summary>root -> the project skeleton (tree) as text.</summary>
        public static Task<string> SkeletonAsync(string nodeExe, string scriptPath, string rootDir, bool respectGitignore)
            => RunAsync(nodeExe, scriptPath, ModeJson("skeleton", rootDir, respectGitignore));

        /// <summary>
        /// root -> project skeleton, with an explicit list of folder names to omit
        /// (overrides the bridge defaults). An empty list omits nothing.
        /// </summary>
        public static Task<string> SkeletonAsync(string nodeExe, string scriptPath, string rootDir, bool respectGitignore, string[] excludeFolders)
            => RunAsync(nodeExe, scriptPath, SkeletonJson(rootDir, respectGitignore, excludeFolders));

        private static async Task<string> RunAsync(string nodeExe, string scriptPath, string json)
        {
            var psi = new ProcessStartInfo
            {
                FileName = nodeExe,
                Arguments = "\"" + scriptPath + "\"",
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                StandardOutputEncoding = Encoding.UTF8,
                StandardErrorEncoding = Encoding.UTF8,
            };

            using (var proc = new Process { StartInfo = psi, EnableRaisingEvents = true })
            {
                var exited = new TaskCompletionSource<int>();
                proc.Exited += (_, __) => exited.TrySetResult(proc.ExitCode);

                proc.Start();

                // Read stdout/stderr concurrently with writing stdin to avoid deadlock.
                Task<string> outTask = proc.StandardOutput.ReadToEndAsync();
                Task<string> errTask = proc.StandardError.ReadToEndAsync();

                await proc.StandardInput.WriteAsync(json).ConfigureAwait(false);
                proc.StandardInput.Close();

                string output = await outTask.ConfigureAwait(false);
                string error = await errTask.ConfigureAwait(false);
                int exitCode = await exited.Task.ConfigureAwait(false);

                if (exitCode != 0)
                {
                    throw new InvalidOperationException(
                        "Node bridge failed (exit " + exitCode + "): " + error);
                }

                return output;
            }
        }

        private static string ScanJson(string mode, ScanRequest r)
        {
            var sb = new StringBuilder();
            sb.Append("{\"mode\":").Append(JsonString(mode)).Append(',');
            sb.Append("\"rootDir\":").Append(JsonString(r.RootDir)).Append(',');
            sb.Append("\"includedFiles\":[");
            for (int i = 0; i < r.IncludedFiles.Length; i++)
            {
                if (i > 0) sb.Append(',');
                sb.Append(JsonString(r.IncludedFiles[i]));
            }
            sb.Append("],");
            sb.Append("\"includeEnvFiles\":").Append(Bool(r.IncludeEnvFiles)).Append(',');
            sb.Append("\"stripComments\":").Append(Bool(r.StripComments)).Append(',');
            sb.Append("\"removeBlankLines\":").Append(Bool(r.RemoveBlankLines));
            sb.Append('}');
            return sb.ToString();
        }

        private static string ModeJson(string mode, string rootDir, bool respectGitignore)
        {
            return "{\"mode\":" + JsonString(mode)
                + ",\"rootDir\":" + JsonString(rootDir)
                + ",\"respectGitignore\":" + Bool(respectGitignore) + "}";
        }

        private static string SkeletonJson(string rootDir, bool respectGitignore, string[] excludeFolders)
        {
            var sb = new StringBuilder();
            sb.Append("{\"mode\":\"skeleton\",");
            sb.Append("\"rootDir\":").Append(JsonString(rootDir)).Append(',');
            sb.Append("\"respectGitignore\":").Append(Bool(respectGitignore)).Append(',');
            sb.Append("\"excludeFolders\":[");
            if (excludeFolders != null)
            {
                for (int i = 0; i < excludeFolders.Length; i++)
                {
                    if (i > 0) sb.Append(',');
                    sb.Append(JsonString(excludeFolders[i]));
                }
            }
            sb.Append("]}");
            return sb.ToString();
        }

        private static string Bool(bool b) => b ? "true" : "false";

        private static string JsonString(string s)
        {
            if (s == null) return "null";
            var sb = new StringBuilder("\"");
            foreach (char c in s)
            {
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (c < 0x20) sb.Append("\\u").Append(((int)c).ToString("x4"));
                        else sb.Append(c);
                        break;
                }
            }
            sb.Append('"');
            return sb.ToString();
        }
    }
}
