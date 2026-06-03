using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;

namespace ContextPicker
{
    /// <summary>
    /// A node in the workspace tree, with a tri-state checkbox that propagates
    /// to children and recomputes parents (the classic WPF MVVM pattern).
    /// </summary>
    public sealed class FileNode : INotifyPropertyChanged
    {
        public string Name { get; set; }
        public string FullPath { get; set; }
        public bool IsDirectory { get; set; }
        public FileNode Parent { get; set; }
        public ObservableCollection<FileNode> Children { get; } = new ObservableCollection<FileNode>();

        private bool? _isChecked = false;
        public bool? IsChecked
        {
            get { return _isChecked; }
            set { SetIsChecked(value, true, true); }
        }

        private void SetIsChecked(bool? value, bool updateChildren, bool updateParent)
        {
            if (value == _isChecked) return;
            _isChecked = value;

            if (updateChildren && _isChecked.HasValue)
            {
                foreach (FileNode child in Children)
                {
                    child.SetIsChecked(_isChecked, true, false);
                }
            }

            if (updateParent && Parent != null)
            {
                Parent.VerifyCheckState();
            }

            OnPropertyChanged("IsChecked");
        }

        private void VerifyCheckState()
        {
            bool? state = null;
            bool first = true;
            foreach (FileNode child in Children)
            {
                if (first)
                {
                    state = child.IsChecked;
                    first = false;
                }
                else if (state != child.IsChecked)
                {
                    state = null;
                    break;
                }
            }
            SetIsChecked(state, false, true);
        }

        /// <summary>Adds the full paths of all checked files (under this node) to the list.</summary>
        public void CollectCheckedFiles(List<string> into)
        {
            if (!IsDirectory)
            {
                if (_isChecked == true)
                {
                    into.Add(FullPath);
                }
                return;
            }
            foreach (FileNode child in Children)
            {
                child.CollectCheckedFiles(into);
            }
        }

        public event PropertyChangedEventHandler PropertyChanged;

        private void OnPropertyChanged(string name)
        {
            PropertyChangedEventHandler handler = PropertyChanged;
            if (handler != null)
            {
                handler(this, new PropertyChangedEventArgs(name));
            }
        }
    }
}
