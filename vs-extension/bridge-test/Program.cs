using System;
using System.Text.Json;
using System.Threading.Tasks;
using ContextPicker;

internal static class Program
{
    // Usage: dotnet run -- <scan-selection.js> <rootDir> [file1 file2 ...]
    private static async Task<int> Main(string[] args)
    {
        if (args.Length < 2)
        {
            Console.Error.WriteLine("Usage: dotnet run -- <scan-selection.js> <rootDir> [file1 ...]");
            return 1;
        }

        string script = args[0];
        string root = args[1];
        string[] files = args.Length > 2 ? args[2..] : Array.Empty<string>();

        try
        {
            // 1) tree mode -> JSON listing
            string treeJson = await NodeBridge.TreeJsonAsync("node", script, root, respectGitignore: true);
            using (var doc = JsonDocument.Parse(treeJson))
            {
                var rootEl = doc.RootElement;
                int childCount = rootEl.GetProperty("children").GetArrayLength();
                Console.WriteLine($"[tree] root='{rootEl.GetProperty("name").GetString()}' children={childCount}");
            }

            // 2) skeleton mode -> text
            string skeleton = await NodeBridge.SkeletonAsync("node", script, root, respectGitignore: true);
            string[] lines = skeleton.Split('\n');
            Console.WriteLine($"[skeleton] {lines.Length} lines, root line='{lines[0]}'");

            // 3) scan mode -> formatted contents
            if (files.Length > 0)
            {
                var request = new ScanRequest
                {
                    RootDir = root,
                    IncludedFiles = files,
                    StripComments = true,
                    RemoveBlankLines = true,
                };
                string scan = await NodeBridge.ScanAsync("node", script, request);
                Console.WriteLine($"[scan] {scan.Length} chars for {files.Length} file(s)");
            }

            Console.WriteLine("ALL MODES OK");
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("BRIDGE ERROR: " + ex.Message);
            return 2;
        }
    }
}
