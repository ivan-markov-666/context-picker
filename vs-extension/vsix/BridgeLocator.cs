using System.IO;
using System.Reflection;

namespace ContextPicker
{
    /// <summary>Locates Node and the bundled scan-selection.js shipped in the VSIX.</summary>
    public static class BridgeLocator
    {
        /// <summary>
        /// Path to the bundled bridge script. It is shipped inside the VSIX under a
        /// "node-bridge" folder next to the extension assembly (configure the build
        /// to copy dist-cli/scan-selection.js there).
        /// </summary>
        public static string ScriptPath()
        {
            string dir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            return Path.Combine(dir, "node-bridge", "scan-selection.js");
        }

        /// <summary>The Node executable. "node" resolves it from PATH.</summary>
        public static string NodeExe()
        {
            return "node";
        }
    }
}
