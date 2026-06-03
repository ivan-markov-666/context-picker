using System.Windows.Controls;
using Microsoft.VisualStudio.Shell;
using Microsoft.VisualStudio.Shell.Interop;

namespace ContextPicker
{
    public partial class ContextPickerToolWindowControl : UserControl
    {
        public ContextPickerToolWindowControl()
        {
            InitializeComponent();

            var vm = new ContextPickerViewModel(BridgeLocator.NodeExe(), BridgeLocator.ScriptPath(), TryGetSolutionDir);
            DataContext = vm;
            _ = vm.InitializeAsync();
        }

        private static string TryGetSolutionDir()
        {
            try
            {
                ThreadHelper.ThrowIfNotOnUIThread();
                var solution = Package.GetGlobalService(typeof(SVsSolution)) as IVsSolution;
                if (solution == null) return null;
                string dir, file, opts;
                solution.GetSolutionInfo(out dir, out file, out opts);
                return string.IsNullOrEmpty(dir) ? null : dir;
            }
            catch { return null; }
        }
    }
}