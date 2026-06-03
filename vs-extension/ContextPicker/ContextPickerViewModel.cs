using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;

namespace ContextPicker
{
    public sealed class ContextPickerViewModel : INotifyPropertyChanged
    {
        private readonly string _nodeExe;
        private readonly string _scriptPath;
        private readonly Func<string> _getWorkspaceRoot;
        private string _workspaceRoot;

        public ContextPickerViewModel(string nodeExe, string scriptPath, Func<string> getWorkspaceRoot)
        {
            _nodeExe = nodeExe;
            _scriptPath = scriptPath;
            _getWorkspaceRoot = getWorkspaceRoot;
            GenerateCommand = new RelayCommand(() => RunSafe(GenerateAsync));
            SkeletonCommand = new RelayCommand(() => RunSafe(SkeletonAsync));
            RefreshCommand = new RelayCommand(() => RunSafe(ReloadAsync));
            ClearFilterCommand = new RelayCommand(() => { SearchText = string.Empty; });
            CheckShownCommand = new RelayCommand(CheckShown);
        }

        public ObservableCollection<FileNode> RootNodes { get; } = new ObservableCollection<FileNode>();

        public ICommand GenerateCommand { get; private set; }
        public ICommand SkeletonCommand { get; private set; }
        public ICommand RefreshCommand { get; private set; }
        public ICommand ClearFilterCommand { get; private set; }
        public ICommand CheckShownCommand { get; private set; }

        private bool _stripComments;
        public bool StripComments
        {
            get { return _stripComments; }
            set { _stripComments = value; OnPropertyChanged("StripComments"); }
        }

        private bool _removeBlankLines;
        public bool RemoveBlankLines
        {
            get { return _removeBlankLines; }
            set { _removeBlankLines = value; OnPropertyChanged("RemoveBlankLines"); }
        }

        private bool _respectGitignore = true;
        public bool RespectGitignore
        {
            get { return _respectGitignore; }
            set
            {
                if (_respectGitignore == value) return;
                _respectGitignore = value;
                OnPropertyChanged("RespectGitignore");
                RunSafe(ReloadAsync);
            }
        }

        private string _searchText = string.Empty;
        public string SearchText
        {
            get { return _searchText; }
            set
            {
                if (_searchText == value) return;
                _searchText = value;
                OnPropertyChanged("SearchText");
                ApplyFilter();
            }
        }

        private string _status = "Open a folder/solution, then click Refresh.";
        public string Status
        {
            get { return _status; }
            set { _status = value; OnPropertyChanged("Status"); }
        }

        public async Task InitializeAsync()
        {
            await ReloadAsync();
        }

        private async Task ReloadAsync()
        {
            _workspaceRoot = _getWorkspaceRoot != null ? _getWorkspaceRoot() : null;
            if (string.IsNullOrEmpty(_workspaceRoot))
            {
                RootNodes.Clear();
                Status = "No folder or solution is open. Open one, then click Refresh.";
                return;
            }
            Status = "Loading tree...";
            string flat = await NodeBridge.TreeAsync(_nodeExe, _scriptPath, _workspaceRoot, RespectGitignore);
            FileNode root = BuildTree(_workspaceRoot, flat);
            RootNodes.Clear();
            RootNodes.Add(root);
            ApplyFilter(); // honour any active filter + open the root
            Status = "Ready. Tick files/folders, then Generate.";
        }

        private async Task GenerateAsync()
        {
            if (RootNodes.Count == 0)
            {
                Status = "Nothing loaded. Click Refresh.";
                return;
            }
            var files = new List<string>();
            foreach (FileNode root in RootNodes)
            {
                root.CollectCheckedFiles(files);
            }
            if (files.Count == 0)
            {
                Status = "No files selected.";
                return;
            }

            Status = "Generating " + files.Count + " file(s)...";
            var request = new ScanRequest
            {
                RootDir = _workspaceRoot,
                IncludedFiles = files.ToArray(),
                StripComments = StripComments,
                RemoveBlankLines = RemoveBlankLines,
                IncludeEnvFiles = false,
            };
            string text = await NodeBridge.ScanAsync(_nodeExe, _scriptPath, request);
            ShowOutput(text);
            Status = "Generated " + files.Count + " file(s) (" + text.Length + " chars) — opened in editor.";
        }

        private async Task SkeletonAsync()
        {
            if (string.IsNullOrEmpty(_workspaceRoot))
            {
                Status = "Nothing loaded. Click Refresh first.";
                return;
            }
            Status = "Building skeleton...";
            string text = await NodeBridge.SkeletonAsync(_nodeExe, _scriptPath, _workspaceRoot, RespectGitignore);
            ShowOutput(text);
            Status = "Skeleton opened in editor.";
        }

        /// <summary>Filters the tree to the paths pasted in the search box.</summary>
        private void ApplyFilter()
        {
            string[] terms = ParseTerms(_searchText);
            int shown = 0;
            foreach (FileNode root in RootNodes)
            {
                root.ApplyFilter(terms);
                root.IsVisible = true;   // always keep the root node visible
                root.IsExpanded = true;  // ...and open
                shown += root.CountVisibleFiles();
            }
            if (terms.Length > 0)
            {
                Status = "Filter: " + shown + " file(s) match. Tick them (or 'Check shown'), then Generate.";
            }
        }

        /// <summary>Checks every file currently visible under the filter.</summary>
        private void CheckShown()
        {
            int shown = 0;
            foreach (FileNode root in RootNodes)
            {
                root.CheckVisibleFiles();
                shown += root.CountVisibleFiles();
            }
            Status = "Checked " + shown + " shown file(s). Click Generate.";
        }

        /// <summary>Splits the search text into normalized terms (one per line / comma).</summary>
        private static string[] ParseTerms(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return new string[0];
            }
            string[] parts = text.Split(new[] { '\n', '\r', ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
            var list = new List<string>();
            foreach (string part in parts)
            {
                string t = part.Trim().Replace('\\', '/').ToLowerInvariant();
                if (t.Length > 0)
                {
                    list.Add(t);
                }
            }
            return list.ToArray();
        }

        private static void ShowOutput(string text)
        {
            // Best-effort clipboard (may be locked by another app -> ignore failures).
            try { Clipboard.SetText(text); } catch { }

            // Always open the result in an editor so it is never lost.
            try
            {
                string path = Path.Combine(Path.GetTempPath(), "ContextPicker-output.txt");
                File.WriteAllText(path, text);
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(path) { UseShellExecute = true });
            }
            catch { }
        }

        private static FileNode BuildTree(string rootPath, string flat)
        {
            string rootName = Path.GetFileName(rootPath.TrimEnd('\\', '/'));
            if (string.IsNullOrEmpty(rootName))
            {
                rootName = rootPath;
            }
            var root = new FileNode { Name = rootName, FullPath = rootPath, IsDirectory = true };

            var byPath = new Dictionary<string, FileNode>(StringComparer.OrdinalIgnoreCase);
            byPath[rootPath] = root;

            if (!string.IsNullOrEmpty(flat))
            {
                foreach (string rawLine in flat.Split('\n'))
                {
                    string line = rawLine.TrimEnd('\r');
                    if (line.Length < 3) continue;
                    bool isDir = line[0] == 'D';
                    string path = line.Substring(2);
                    var node = new FileNode { Name = Path.GetFileName(path), FullPath = path, IsDirectory = isDir };

                    string parentPath = Path.GetDirectoryName(path);
                    FileNode parent;
                    if (parentPath != null && byPath.TryGetValue(parentPath, out parent))
                    {
                        node.Parent = parent;
                        parent.Children.Add(node);
                    }
                    else
                    {
                        node.Parent = root;
                        root.Children.Add(node);
                    }

                    if (isDir)
                    {
                        byPath[path] = node;
                    }
                }
            }

            return root;
        }

        private async void RunSafe(Func<Task> action)
        {
            try
            {
                await action();
            }
            catch (Exception ex)
            {
                Status = "Error: " + ex.Message;
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
