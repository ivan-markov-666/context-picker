using System;
using System.Threading.Tasks;
using ContextPicker;

internal static class Program
{
    // Usage: dotnet run -- <scan-selection.js> <rootDir> <file1> [file2 ...]
    private static async Task<int> Main(string[] args)
    {
        if (args.Length < 3)
        {
            Console.Error.WriteLine(
                "Usage: dotnet run -- <scan-selection.js> <rootDir> <file1> [file2 ...]");
            return 1;
        }

        var request = new ScanRequest
        {
            RootDir = args[1],
            IncludedFiles = args[2..],
            StripComments = true,
            RemoveBlankLines = true,
        };

        try
        {
            string text = await NodeBridge.ScanAsync("node", args[0], request);
            Console.Out.Write(text);
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("BRIDGE ERROR: " + ex.Message);
            return 2;
        }
    }
}
