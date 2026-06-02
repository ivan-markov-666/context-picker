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
    /// <summary>
    /// Drives the Context Picker tool window: loads the workspace tree (via the
    /// Node bridge), tracks the toggles, and runs Generate / Copy Skeleton.
    /// Output goes to the clipboard for v1 (an editor tab can come later).
    /// </summary>
    public sealed class ContextPickerViewModel : INotifyPropertyChanged
    {
        private readonly string _nodeExe;
        private readonly string _scriptPath;
        private string _workspaceRoot;

        public ContextPickerViewModel(string nodeExe, string scriptPath)
        {
            _nodeExe = nodeExe;
            _scriptPath = scriptPath;
            GenerateCommand = new RelayCommand(() => RunSafe(GenerateAsync));
            SkeletonCommand = new RelayCommand(() => RunSafe(SkeletonAsync));
            RefreshCommand = new RelayCommand(() => RunSafe(ReloadAsync));
        }

        public ObservableCollection<FileNode> RootNodes { get; } = new ObservableCollection<FileNode>();

        public ICommand GenerateCommand { get; private set; }
        public ICommand SkeletonCommand { get; private set; }
        public ICommand RefreshCommand { get; private set; }

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
                RunSafe(ReloadAsync); // changes which entries are shown
            }
        }

        private string _status = "Open a folder/solution, then Refresh.";
        public string Status
        {
            get { return _status; }
            set { _status = value; OnPropertyChanged("Status"); }
        }

        /// <summary>Called by the tool window once the workspace root is known.</summary>
        public async Task InitializeAsync(string workspaceRoot)
        {
            _workspaceRoot = workspaceRoot;
            await ReloadAsync();
        }

        private async Task ReloadAsync()
        {
            if (string.IsNullOrEmpty(_workspaceRoot))
            {
                Status = "No folder or solution is open.";
                return;
            }
            Status = "Loading tree...";
            string flat = await NodeBridge.TreeAsync(_nodeExe, _scriptPath, _workspaceRoot, RespectGitignore);
            FileNode root = BuildTree(_workspaceRoot, flat);
            RootNodes.Clear();
            RootNodes.Add(root);
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
            Clipboard.SetText(text);
            Status = "Copied " + files.Count + " file(s) to clipboard (" + text.Length + " chars).";
        }

        private async Task SkeletonAsync()
        {
            if (string.IsNullOrEmpty(_workspaceRoot))
            {
                Status = "No folder or solution is open.";
                return;
            }
            Status = "Building skeleton...";
            string text = await NodeBridge.SkeletonAsync(_nodeExe, _scriptPath, _workspaceRoot, RespectGitignore);
            Clipboard.SetText(text);
            Status = "Copied project skeleton to clipboard.";
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
                    if (line.Length < 3) continue; // need "D\t" + at least 1 char
                    bool isDir = line[0] == 'D';
                    string path = line.Substring(2); // skip the "D\t" / "F\t" prefix
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
