using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;

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
            CopyFilesCommand = new RelayCommand(() => RunSafe(CopyFilesAsync));
            CopyToDesktopCommand = new RelayCommand(() => RunSafe(CopyToDesktopAsync));
            SavePresetCommand = new RelayCommand(SavePreset);
            LoadPresetCommand = new RelayCommand(LoadPreset);
            DeletePresetCommand = new RelayCommand(DeletePreset);
            LoadMaxChars();
            LoadCopyAsTxt();

            _recountTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(400) };
            _recountTimer.Tick += (s, e) => { _recountTimer.Stop(); _ = RecountSafeAsync(); };
        }

        public ObservableCollection<FileNode> RootNodes { get; } = new ObservableCollection<FileNode>();

        public ICommand GenerateCommand { get; private set; }
        public ICommand SkeletonCommand { get; private set; }
        public ICommand RefreshCommand { get; private set; }
        public ICommand ClearFilterCommand { get; private set; }
        public ICommand CheckShownCommand { get; private set; }
        public ICommand CopyFilesCommand { get; private set; }
        public ICommand CopyToDesktopCommand { get; private set; }
        public ICommand SavePresetCommand { get; private set; }
        public ICommand LoadPresetCommand { get; private set; }
        public ICommand DeletePresetCommand { get; private set; }

        /// <summary>Saved selection presets for the current workspace.</summary>
        public ObservableCollection<string> PresetNames { get; } = new ObservableCollection<string>();

        private string _selectedPreset;
        public string SelectedPreset
        {
            get { return _selectedPreset; }
            set { _selectedPreset = value; OnPropertyChanged("SelectedPreset"); }
        }

        private string _newPresetName = string.Empty;
        public string NewPresetName
        {
            get { return _newPresetName; }
            set { _newPresetName = value; OnPropertyChanged("NewPresetName"); }
        }

        private bool _stripComments;
        public bool StripComments
        {
            get { return _stripComments; }
            set { _stripComments = value; OnPropertyChanged("StripComments"); ScheduleRecount(); }
        }

        private bool _removeBlankLines;
        public bool RemoveBlankLines
        {
            get { return _removeBlankLines; }
            set { _removeBlankLines = value; OnPropertyChanged("RemoveBlankLines"); ScheduleRecount(); }
        }

        private bool _includeEnvFiles;
        public bool IncludeEnvFiles
        {
            get { return _includeEnvFiles; }
            set { _includeEnvFiles = value; OnPropertyChanged("IncludeEnvFiles"); ScheduleRecount(); }
        }

        private bool _copyAsTxt;
        public bool CopyAsTxt
        {
            get { return _copyAsTxt; }
            set { if (_copyAsTxt == value) return; _copyAsTxt = value; OnPropertyChanged("CopyAsTxt"); SaveCopyAsTxt(); }
        }

        // --- Live size counter (lines/chars of what Generate would produce) ---

        private readonly DispatcherTimer _recountTimer;
        private int _countSeq;
        private int _countFiles, _countLines, _countChars;
        private int _maxChars;

        private string _countText = "No files selected.";
        public string CountText
        {
            get { return _countText; }
            set { _countText = value; OnPropertyChanged("CountText"); }
        }

        private bool _isOverLimit;
        public bool IsOverLimit
        {
            get { return _isOverLimit; }
            set { if (_isOverLimit != value) { _isOverLimit = value; OnPropertyChanged("IsOverLimit"); } }
        }

        private string _maxCharsText = "0";
        public string MaxCharsText
        {
            get { return _maxCharsText; }
            set
            {
                if (_maxCharsText == value) return;
                _maxCharsText = value;
                OnPropertyChanged("MaxCharsText");
                int parsed;
                _maxChars = (int.TryParse((value ?? string.Empty).Trim(), out parsed) && parsed > 0) ? parsed : 0;
                UpdateCountText();
                SaveMaxChars();
            }
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
            SubscribeToNodes(root); // so the live counter reacts to ticking
            RefreshPresetNames();
            ApplyFilter(); // honour any active filter + open the root
            Status = "Ready. Tick files/folders, then Generate.";
            ScheduleRecount();
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
                IncludeEnvFiles = IncludeEnvFiles,
            };
            string text = await NodeBridge.ScanAsync(_nodeExe, _scriptPath, request);
            ShowOutput(text);
            Status = "Generated " + files.Count + " file(s) (" + text.Length + " chars) — opened in editor.";
        }

        /// <summary>
        /// Builds the skeleton of the current selection: every folder holding a
        /// ticked file (plus the ancestors linking it to the root) and the ticked
        /// files themselves. Folders without a ticked file are left out.
        /// </summary>
        private async Task SkeletonAsync()
        {
            if (string.IsNullOrEmpty(_workspaceRoot))
            {
                Status = "Nothing loaded. Click Refresh first.";
                return;
            }
            var files = new List<string>();
            foreach (FileNode root in RootNodes)
            {
                root.CollectCheckedFiles(files);
            }
            if (files.Count == 0)
            {
                Status = "No files selected — the skeleton follows your ticked files.";
                return;
            }

            Status = "Building skeleton...";
            string text = await NodeBridge.SkeletonAsync(_nodeExe, _scriptPath, _workspaceRoot, files.ToArray());
            ShowOutput(text);
            Status = "Skeleton of " + files.Count + " selected file(s) opened in editor.";
        }

        /// <summary>
        /// Copies the selected files into a single temp folder (cleaned each run)
        /// and opens it, so they can be dragged straight into an LLM chat. Original
        /// files are copied; same-named files get the parent folder prefixed.
        /// </summary>
        private async Task CopyFilesAsync()
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

            Status = "Copying " + files.Count + " file(s)...";
            string dir = Path.Combine(Path.GetTempPath(), "ContextPicker-files");
            int written = await NodeBridge.CopyFilesAsync(
                _nodeExe, _scriptPath, dir, files.ToArray(), StripComments, RemoveBlankLines, IncludeEnvFiles, CopyAsTxt);

            try
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(dir) { UseShellExecute = true });
            }
            catch { }

            var notes = new List<string>();
            if (StripComments || RemoveBlankLines) notes.Add("transforms applied");
            if (CopyAsTxt) notes.Add(".txt added");
            string note = notes.Count > 0 ? " (" + string.Join(", ", notes) + ")" : string.Empty;
            Status = "Copied " + written + " file(s) to a folder" + note + " — drag them into your chat.";
        }

        /// <summary>
        /// Copies the selected files to a folder on the Desktop, encoding each file's
        /// relative path into its (flat) name and appending .txt — e.g.
        /// src/lib/app.cs -> src__lib__app.cs.txt. Built for uploading to OneDrive,
        /// which shows everything flat: the folder path is preserved in the name.
        /// </summary>
        private async Task CopyToDesktopAsync()
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

            Status = "Copying " + files.Count + " file(s) to Desktop...";
            string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            string dir = Path.Combine(desktop, "ContextPicker");
            int written = await NodeBridge.CopyFilesAsync(
                _nodeExe, _scriptPath, dir, files.ToArray(),
                StripComments, RemoveBlankLines, IncludeEnvFiles, true, _workspaceRoot, true, "__", true);

            try
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(dir) { UseShellExecute = true });
            }
            catch { }

            Status = written == 0
                ? "OneDrive folder already up to date — no changed files."
                : "Synced " + written + " changed file(s) to Desktop\\ContextPicker (unchanged left untouched).";
        }

        // --- Selection presets (named, per-workspace, persisted) ---

        private void SavePreset()
        {
            string name = (NewPresetName ?? string.Empty).Trim();
            if (name.Length == 0) name = SelectedPreset;
            if (string.IsNullOrEmpty(name)) { Status = "Type a preset name first."; return; }
            if (string.IsNullOrEmpty(_workspaceRoot)) { Status = "Open a solution first."; return; }

            var files = new List<string>();
            foreach (FileNode root in RootNodes) root.CollectCheckedFiles(files);
            var rels = new List<string>();
            foreach (string f in files)
            {
                string rel = ToRelative(_workspaceRoot, f);
                if (rel.Length > 0) rels.Add(rel);
            }

            var lines = ReadAllPresetLines();
            lines.RemoveAll(p => p.Length >= 2
                && string.Equals(p[0], _workspaceRoot, StringComparison.OrdinalIgnoreCase)
                && string.Equals(p[1], name, StringComparison.OrdinalIgnoreCase));
            var entry = new List<string> { _workspaceRoot, name };
            entry.AddRange(rels);
            lines.Add(entry.ToArray());
            WriteAllPresetLines(lines);

            NewPresetName = string.Empty;
            RefreshPresetNames();
            SelectedPreset = name;
            Status = "Saved preset \"" + name + "\" (" + rels.Count + " file(s)).";
        }

        private void LoadPreset()
        {
            string name = SelectedPreset;
            if (string.IsNullOrEmpty(name)) { Status = "Pick a preset to load."; return; }
            if (RootNodes.Count == 0) { Status = "Nothing loaded. Click Refresh first."; return; }

            string[] entry = null;
            foreach (string[] p in ReadAllPresetLines())
            {
                if (p.Length >= 2
                    && string.Equals(p[0], _workspaceRoot, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(p[1], name, StringComparison.OrdinalIgnoreCase))
                {
                    entry = p;
                    break;
                }
            }
            if (entry == null) { Status = "Preset not found."; return; }

            foreach (FileNode root in RootNodes) root.IsChecked = false; // clear current selection first
            var map = new Dictionary<string, FileNode>(StringComparer.OrdinalIgnoreCase);
            foreach (FileNode root in RootNodes) BuildPathMap(root, map);

            int ticked = 0;
            for (int i = 2; i < entry.Length; i++)
            {
                string abs = Path.Combine(_workspaceRoot, entry[i].Replace('/', Path.DirectorySeparatorChar));
                FileNode node;
                if (map.TryGetValue(abs, out node)) { node.IsChecked = true; ticked++; }
            }
            Status = "Loaded preset \"" + name + "\" — ticked " + ticked + " of " + (entry.Length - 2) + " file(s).";
        }

        private void DeletePreset()
        {
            string name = SelectedPreset;
            if (string.IsNullOrEmpty(name)) { Status = "Pick a preset to delete."; return; }
            var lines = ReadAllPresetLines();
            int before = lines.Count;
            lines.RemoveAll(p => p.Length >= 2
                && string.Equals(p[0], _workspaceRoot, StringComparison.OrdinalIgnoreCase)
                && string.Equals(p[1], name, StringComparison.OrdinalIgnoreCase));
            WriteAllPresetLines(lines);
            RefreshPresetNames();
            Status = before > lines.Count ? "Deleted preset \"" + name + "\"." : "Preset not found.";
        }

        private void BuildPathMap(FileNode node, Dictionary<string, FileNode> map)
        {
            if (!node.IsDirectory && !string.IsNullOrEmpty(node.FullPath))
            {
                map[node.FullPath] = node;
            }
            foreach (FileNode child in node.Children) BuildPathMap(child, map);
        }

        private void RefreshPresetNames()
        {
            PresetNames.Clear();
            if (string.IsNullOrEmpty(_workspaceRoot)) return;
            var names = new List<string>();
            foreach (string[] p in ReadAllPresetLines())
            {
                if (p.Length >= 2 && string.Equals(p[0], _workspaceRoot, StringComparison.OrdinalIgnoreCase))
                {
                    names.Add(p[1]);
                }
            }
            names.Sort(StringComparer.OrdinalIgnoreCase);
            foreach (string n in names) PresetNames.Add(n);
        }

        private static string PresetsFilePath()
        {
            string dir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "ContextPicker");
            return Path.Combine(dir, "presets.tsv");
        }

        private static List<string[]> ReadAllPresetLines()
        {
            var lines = new List<string[]>();
            try
            {
                string file = PresetsFilePath();
                if (File.Exists(file))
                {
                    foreach (string raw in File.ReadAllLines(file))
                    {
                        if (raw.Length == 0) continue;
                        string[] parts = raw.Split('\t');
                        if (parts.Length >= 2) lines.Add(parts);
                    }
                }
            }
            catch { }
            return lines;
        }

        private static void WriteAllPresetLines(List<string[]> lines)
        {
            try
            {
                string file = PresetsFilePath();
                Directory.CreateDirectory(Path.GetDirectoryName(file));
                var outLines = new List<string>();
                foreach (string[] p in lines) outLines.Add(string.Join("\t", p));
                File.WriteAllLines(file, outLines);
            }
            catch { }
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

        // --- Live size counter implementation ---

        private void ScheduleRecount()
        {
            if (_recountTimer == null) return;
            _recountTimer.Stop();
            _recountTimer.Start();
        }

        private void SubscribeToNodes(FileNode node)
        {
            node.PropertyChanged += OnNodeChanged;
            foreach (FileNode child in node.Children)
            {
                SubscribeToNodes(child);
            }
        }

        private void OnNodeChanged(object sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == "IsChecked")
            {
                ScheduleRecount();
            }
        }

        private async Task RecountSafeAsync()
        {
            int seq = ++_countSeq;
            try
            {
                if (string.IsNullOrEmpty(_workspaceRoot) || RootNodes.Count == 0)
                {
                    SetCount(0, 0, 0);
                    return;
                }
                var files = new List<string>();
                foreach (FileNode root in RootNodes)
                {
                    root.CollectCheckedFiles(files);
                }
                if (files.Count == 0)
                {
                    SetCount(0, 0, 0);
                    return;
                }

                CountText = files.Count + " file(s) · measuring…";
                var request = new ScanRequest
                {
                    RootDir = _workspaceRoot,
                    IncludedFiles = files.ToArray(),
                    StripComments = StripComments,
                    RemoveBlankLines = RemoveBlankLines,
                    IncludeEnvFiles = IncludeEnvFiles,
                };
                ScanCount count = await NodeBridge.CountAsync(_nodeExe, _scriptPath, request);
                if (seq != _countSeq) return; // a newer change superseded this run
                SetCount(files.Count, count.Lines, count.Chars);
            }
            catch
            {
                if (seq == _countSeq)
                {
                    CountText = "(size unavailable)";
                }
            }
        }

        private void SetCount(int files, int lines, int chars)
        {
            _countFiles = files;
            _countLines = lines;
            _countChars = chars;
            UpdateCountText();
        }

        private void UpdateCountText()
        {
            bool over = _maxChars > 0 && _countChars > _maxChars;
            IsOverLimit = over;

            if (_countFiles == 0)
            {
                CountText = _maxChars > 0
                    ? "No files selected. (limit " + _maxChars.ToString("N0") + " chars)"
                    : "No files selected.";
                return;
            }

            string limit = _maxChars > 0 ? " / " + _maxChars.ToString("N0") + " max" : string.Empty;
            string prefix = over ? "OVER LIMIT — " : string.Empty;
            CountText = prefix + _countFiles + " file(s) · "
                + _countLines.ToString("N0") + " lines · "
                + _countChars.ToString("N0") + " chars" + limit;
        }

        private static string MaxCharsFilePath()
        {
            string dir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "ContextPicker");
            return Path.Combine(dir, "max-chars.txt");
        }

        private void LoadMaxChars()
        {
            try
            {
                string file = MaxCharsFilePath();
                if (File.Exists(file))
                {
                    int n;
                    if (int.TryParse(File.ReadAllText(file).Trim(), out n) && n > 0)
                    {
                        _maxChars = n;
                        _maxCharsText = n.ToString();
                    }
                }
            }
            catch { }
        }

        private void SaveMaxChars()
        {
            try
            {
                string file = MaxCharsFilePath();
                Directory.CreateDirectory(Path.GetDirectoryName(file));
                File.WriteAllText(file, _maxChars.ToString());
            }
            catch { }
        }

        private static string CopyAsTxtFilePath()
        {
            string dir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "ContextPicker");
            return Path.Combine(dir, "copy-as-txt.txt");
        }

        private void LoadCopyAsTxt()
        {
            try
            {
                string file = CopyAsTxtFilePath();
                if (File.Exists(file))
                {
                    _copyAsTxt = File.ReadAllText(file).Trim() == "1";
                }
            }
            catch { }
        }

        private void SaveCopyAsTxt()
        {
            try
            {
                string file = CopyAsTxtFilePath();
                Directory.CreateDirectory(Path.GetDirectoryName(file));
                File.WriteAllText(file, _copyAsTxt ? "1" : "0");
            }
            catch { }
        }

        private static string ToRelative(string root, string full)
        {
            if (string.IsNullOrEmpty(root) || string.IsNullOrEmpty(full)) return string.Empty;
            string r = root.TrimEnd('\\', '/');
            if (full.Length >= r.Length && full.Substring(0, r.Length).Equals(r, StringComparison.OrdinalIgnoreCase))
            {
                return full.Substring(r.Length).TrimStart('\\', '/').Replace('\\', '/');
            }
            return full.Replace('\\', '/');
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
