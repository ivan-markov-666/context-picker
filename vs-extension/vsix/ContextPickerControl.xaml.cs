using System.Windows.Controls;

namespace ContextPicker
{
    /// <summary>WPF user control hosted by the tool window. Just binds the view model.</summary>
    public partial class ContextPickerControl : UserControl
    {
        public ContextPickerControl()
        {
            InitializeComponent();
        }

        /// <summary>Sets the view model (call after resolving the workspace root).</summary>
        public void SetViewModel(ContextPickerViewModel viewModel)
        {
            DataContext = viewModel;
        }
    }
}
