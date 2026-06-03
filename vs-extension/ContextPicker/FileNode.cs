using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;

namespace ContextPicker
{
    /// <summary>
    /// A node in the workspace tree, with a tri-state checkbox that propagates
    /// to children and recomputes parents (the classic WPF MVVM pattern). Also
    /// carries filter state (IsVisible / IsExpanded) for the search box.
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

        private bool _isVisible = true;
        public bool IsVisible
        {
            get { return _isVisible; }
            set { if (_isVisible != value) { _isVisible = value; OnPropertyChanged("IsVisible"); } }
        }

        private bool _isExpanded;
        public bool IsExpanded
        {
            get { return _isExpanded; }
            set { if (_isExpanded != value) { _isExpanded = value; OnPropertyChanged("IsExpanded"); } }
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

        /// <summary>
        /// Filters the subtree against the given normalized terms. A file is
        /// visible if its path contains any term; a folder is visible if it (or
        /// any descendant) matches, and is expanded to reveal the matches. Empty
        /// terms make everything visible. Returns this node's visibility.
        /// </summary>
        public bool ApplyFilter(string[] terms)
        {
            bool selfMatches = terms.Length == 0 || Matches(terms);

            bool anyChildVisible = false;
            foreach (FileNode child in Children)
            {
                if (child.ApplyFilter(terms))
                {
                    anyChildVisible = true;
                }
            }

            bool visible = selfMatches || anyChildVisible;
            IsVisible = visible;

            if (IsDirectory && terms.Length > 0)
            {
                IsExpanded = anyChildVisible; // open folders that contain matches
            }

            return visible;
        }

        private bool Matches(string[] terms)
        {
            string p = (FullPath ?? string.Empty).Replace('\\', '/').ToLowerInvariant();
            foreach (string t in terms)
            {
                if (p.Contains(t))
                {
                    return true;
                }
            }
            return false;
        }

        /// <summary>Checks every currently-visible file (leaf) under this node.</summary>
        public void CheckVisibleFiles()
        {
            if (!IsDirectory)
            {
                if (_isVisible)
                {
                    IsChecked = true;
                }
                return;
            }
            foreach (FileNode child in Children)
            {
                child.CheckVisibleFiles();
            }
        }

        /// <summary>Counts currently-visible files (leaves) under this node.</summary>
        public int CountVisibleFiles()
        {
            if (!IsDirectory)
            {
                return _isVisible ? 1 : 0;
            }
            int n = 0;
            foreach (FileNode child in Children)
            {
                n += child.CountVisibleFiles();
            }
            return n;
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
