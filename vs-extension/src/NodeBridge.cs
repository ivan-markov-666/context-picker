using System;
using System.Diagnostics;
using System.Text;
using System.Threading.Tasks;

namespace ContextPicker
{
    /// <summary>Request passed to the bundled Node bridge (scan-selection.js).</summary>
    public sealed class ScanRequest
    {
        public string RootDir { get; set; } = "";
        public string[] IncludedFiles { get; set; } = Array.Empty<string>();
        public bool IncludeEnvFiles { get; set; }
        public bool StripComments { get; set; }
        public bool RemoveBlankLines { get; set; }
    }

    /// <summary>
    /// Invokes the bundled Node CLI (scan-selection.js) to produce the formatted
    /// scan text, reusing the directory-scanner core (including comment-bear).
    /// Dependency-free and JSON is built by hand, so this compiles on both
    /// .NET Framework 4.7.2 (the VSIX) and modern .NET (the test harness).
    /// </summary>
    public static class NodeBridge
    {
        /// <param name="nodeExe">Path to node, or just "node" to resolve from PATH.</param>
        /// <param name="scriptPath">Path to the bundled scan-selection.js.</param>
        public static async Task<string> ScanAsync(string nodeExe, string scriptPath, ScanRequest request)
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

                await proc.StandardInput.WriteAsync(ToJson(request)).ConfigureAwait(false);
                proc.StandardInput.Close();

                string output = await outTask.ConfigureAwait(false);
                string error = await errTask.ConfigureAwait(false);
                int exitCode = await exited.Task.ConfigureAwait(false);

                if (exitCode != 0)
                {
                    throw new InvalidOperationException(
                        $"Node bridge failed (exit {exitCode}): {error}");
                }

                return output;
            }
        }

        private static string ToJson(ScanRequest r)
        {
            var sb = new StringBuilder();
            sb.Append('{');
            sb.Append("\"rootDir\":").Append(JsonString(r.RootDir)).Append(',');
            sb.Append("\"includedFiles\":[");
            for (int i = 0; i < r.IncludedFiles.Length; i++)
            {
                if (i > 0) sb.Append(',');
                sb.Append(JsonString(r.IncludedFiles[i]));
            }
            sb.Append("],");
            sb.Append("\"includeEnvFiles\":").Append(r.IncludeEnvFiles ? "true" : "false").Append(',');
            sb.Append("\"stripComments\":").Append(r.StripComments ? "true" : "false").Append(',');
            sb.Append("\"removeBlankLines\":").Append(r.RemoveBlankLines ? "true" : "false");
            sb.Append('}');
            return sb.ToString();
        }

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
