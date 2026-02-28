// Terminal CLI with Nostalgic 90's Feel
class TerminalCLI {
    constructor() {
        this.output = document.getElementById('terminal-output');
        this.input = document.getElementById('terminal-input');
        this.commandHistory = [];
        this.historyIndex = -1;
        this.blogArticles = [];
        this.allArticles = [];
        this.articleStatusByFile = new Map();
        this.resume = null;
        this.resumeDraft = false;
        this.about = null;
        this.directories = []; // Explicitly defined directories
        this.draftFolderPaths = [];
        this.currentPath = 'posts'; // Start in posts directory
        this.basePath = 'posts'; // Base path for navigation
        this.retroColors = {}; // Random retro colors
        
        this.init();
    }
    
    async init() {
        // Setup event listeners first so commands work
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.input.addEventListener('input', () => this.handleInput());
        
        // Setup input cursor visibility based on focus
        this.setupInputCursor();
        
        // Setup retro color scheme (randomized)
        this.setupRetroColors();
        
        // Setup terminal resize cursor
        this.setupResizeCursor();
        
        // Setup minimize button
        this.setupMinimizeButton();

        // Setup maximize button
        this.setupMaximizeButton();

        // Setup draggable terminal
        this.setupDrag();
        
        // Update prompt display
        this.updatePrompt();
        
        // Show welcome message
        this.printWelcome();
        
        // Load data from JSON files
        await this.loadData();
        
        // Show data load status
        if (this.blogArticles.length > 0) {
            console.log(`✓ Loaded ${this.blogArticles.length} article(s)`);
        } else {
            console.warn('⚠ No articles loaded - check data/articles.json');
        }
        
        if (this.resume && this.resume.name !== 'Unknown') {
            console.log(`✓ Loaded resume for ${this.resume.name}`);
        } else {
            console.warn('⚠ Resume not loaded - check data/resume.json or data/resume.md');
        }
        
        this.addGlitchEffect();
    }
    
    async loadData() {
        try {
            const cacheBust = `?v=${Date.now()}`;

            // Load articles
            const articlesResponse = await fetch(`data/articles.json${cacheBust}`);
            if (articlesResponse.ok) {
                const data = await articlesResponse.json();
                // Support both array format and object format with directories field
                if (Array.isArray(data)) {
                    this.allArticles = data;
                    this.directories = [];
                } else {
                    this.allArticles = data.articles || [];
                    this.directories = data.directories || [];
                }
                this.articleStatusByFile = new Map();
                this.allArticles.forEach(article => {
                    if (article && article.file) {
                        this.articleStatusByFile.set(article.file, this.normalizeStatus(article.status));
                    }
                });
                this.blogArticles = this.allArticles.filter(article => this.isPublishedArticle(article));
                console.log('Loaded articles:', this.blogArticles.length);
                if (this.directories.length > 0) {
                    console.log('Loaded directories:', this.directories);
                }
            } else {
                console.error('Failed to load articles.json:', articlesResponse.status, articlesResponse.statusText);
                this.allArticles = [];
                this.blogArticles = [];
                this.articleStatusByFile = new Map();
                this.directories = [];
            }

            // Load folder statuses (optional)
            try {
                const foldersResponse = await fetch(`data/folders.json${cacheBust}`);
                if (foldersResponse.ok) {
                    const folderData = await foldersResponse.json();
                    const folders = folderData.folders || [];
                    this.draftFolderPaths = folders
                        .filter(folder => this.normalizeStatus(folder.status) === 'draft' && folder.path)
                        .map(folder => this.normalizePath(folder.path));
                } else {
                    this.draftFolderPaths = [];
                }
            } catch (e) {
                this.draftFolderPaths = [];
            }
            
            // Load resume - try both files and use the one that exists
            // Priority: resume.json first (if exists), then resume.md
            let resumeLoaded = false;
            
            // Try resume.json first (higher priority for structured data)
            const resumeJsonResponse = await fetch(`data/resume.json${cacheBust}`);
            if (resumeJsonResponse.ok) {
                this.resume = await resumeJsonResponse.json();
                this.resumeDraft = this.normalizeStatus(this.resume.status) === 'draft';
                console.log('Loaded resume from resume.json for:', this.resume.name);
                resumeLoaded = true;
            } else {
                // Fall back to resume.md
                const resumeMdResponse = await fetch(`data/resume.md${cacheBust}`);
                if (resumeMdResponse.ok) {
                    const markdown = await resumeMdResponse.text();
                    this.resume = this.parseResumeMarkdown(markdown);
                    this.resumeDraft = false;
                    console.log('Loaded resume from resume.md for:', this.resume.name);
                    resumeLoaded = true;
                } else {
                    console.error('Failed to load resume.json and resume.md');
                }
            }
            
            if (!resumeLoaded) {
                this.resume = {
                    name: 'Unknown',
                    email: 'unknown@example.com',
                    location: 'Unknown',
                    experience: [],
                    education: [],
                    skills: {},
                    certifications: [],
                    publications: []
                };
                this.resumeDraft = false;
            }
            
            // Load about information
            const aboutResponse = await fetch(`data/about.json${cacheBust}`);
            if (aboutResponse.ok) {
                this.about = await aboutResponse.json();
                console.log('Loaded about information for:', this.about.name);
            } else {
                console.warn('Failed to load about.json, using defaults');
                this.about = null;
            }
        } catch (error) {
            console.error('Error loading data:', error);
            // Set defaults on error
            this.blogArticles = [];
            this.allArticles = [];
            this.articleStatusByFile = new Map();
            this.directories = [];
            this.resume = {
                name: 'Unknown',
                email: 'unknown@example.com',
                location: 'Unknown',
                experience: [],
                education: [],
                skills: {},
                certifications: [],
                publications: []
            };
            this.resumeDraft = false;
        }
    }
    
    handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.executeCommand(this.input.value.trim());
            this.input.value = '';
            this.historyIndex = -1;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.commandHistory.length > 0) {
                this.historyIndex = Math.max(0, this.historyIndex - 1);
                this.input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex] || '';
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex >= 0) {
                this.historyIndex = Math.min(this.commandHistory.length - 1, this.historyIndex + 1);
                this.input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex] || '';
            } else {
                this.input.value = '';
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            this.autoComplete();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.input.blur();
            setTimeout(() => this.input.focus(), 100);
        }
    }
    
    handleInput() {
        // Real-time effects could go here
    }
    
    executeCommand(cmd) {
        if (!cmd) return;
        
        // Add to history
        this.commandHistory.push(cmd);
        if (this.commandHistory.length > 50) {
            this.commandHistory.shift();
        }
        
        // Display command with typing effect
        this.printCommand(cmd);
        
        // Small delay for nostalgic feel
        setTimeout(async () => {
            // Parse and execute
            const [command, ...args] = cmd.split(' ');
            
            switch(command.toLowerCase()) {
                case 'help':
                    this.showHelp();
                    break;
                case 'ls':
                    await this.listDirectory();
                    break;
                case 'list':
                case 'list-articles':
                    await this.listAllArticles();
                    break;
                case 'cd':
                    if (args.length > 0) {
                        await this.changeDirectory(args[0]);
                    } else {
                        await this.changeDirectory('~');
                    }
                    break;
                case 'cat':
                case 'read':
                case 'view':
                    if (args.length > 0) {
                        this.viewArticle(args[0]);
                    } else {
                        this.printError('Usage: cat [article-id]\nExample: cat article-1');
                    }
                    break;
                case 'search':
                case 'grep':
                case 'find':
                    if (args.length > 0) {
                        this.searchTags(args.join(' '));
                    } else {
                        this.printError('Usage: search [tag]\nExample: search malware');
                    }
                    break;
                case 'resume':
                case 'cv':
                case 'bio':
                    this.showResume();
                    break;
                case 'clear':
                case 'cls':
                    this.clearTerminal();
                    break;
                case 'whoami':
                    this.showAbout();
                    break;
                case 'date':
                    this.showDate();
                    break;
                case 'pwd':
                    this.printResponse(this.currentPath);
                    break;
                case 'echo':
                    this.printResponse(args.join(' '));
                    break;
                case 'status':
                case 'debug':
                    this.showStatus();
                    break;
                case 'vhs':
                    this.toggleVhs(args[0]);
                    break;
                case 'scanlines':
                    this.toggleScanlines(args[0]);
                    break;
                case 'noise':
                    this.toggleNoise(args[0]);
                    break;
                case 'exit':
                case 'quit':
                    this.printResponse('You can check out anytime you like, but you can never leave...\n(Just kidding, refresh the page to reset)');
                    break;
                default:
                    this.printError(`Command not found: ${command}\nType 'help' for available commands.`);
            }
        }, 100);
    }
    
    printCommand(cmd) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        const prompt = this.getPrompt();
        const promptColor = this.retroColors?.prompt || '#ffff00';
        const commandColor = this.retroColors?.command || '#2121ff';
        line.innerHTML = `<span class="prompt" style="color: ${promptColor}; text-shadow: 0 0 5px ${promptColor};">${this.escapeHtml(prompt)}</span> <span class="command" style="color: ${commandColor}; text-shadow: 0 0 8px ${commandColor};">${this.escapeHtml(cmd)}</span>`;
        this.output.appendChild(line);
        this.scrollToBottom();
    }
    
    printResponse(text, className = 'terminal-response') {
        const response = document.createElement('div');
        response.className = className;
        if (className === 'terminal-welcome') {
            const welcomeColor = this.retroColors?.welcome || this.retroColors?.response || '#ffff00';
            response.style.color = welcomeColor;
            response.style.textShadow = `0 0 5px ${welcomeColor}, 0 0 10px ${welcomeColor}`;
        } else if (className !== 'terminal-error') {
            const responseColor = this.retroColors?.response || '#ffff00';
            response.style.color = responseColor;
            response.style.textShadow = `0 0 3px ${responseColor}`;
        }
        response.innerHTML = `<pre>${this.escapeHtml(text)}</pre>`;
        this.output.appendChild(response);
        this.scrollToBottom();
    }
    
    printError(text) {
        this.printResponse(`ERROR: ${text}`, 'terminal-error');
        // Trigger glitch effect
        this.triggerGlitch();
    }
    
    printWelcome() {
        const welcome = `
 .+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+. 
(                                                                                                 )
 )       /$$    /$$  /$$$$$$        /$$      /$$  /$$$$$$  /$$   /$$ /$$$$$$$$ /$$     /$$       ( 
(       | $$   | $$ /$$__  $$      | $$$    /$$$ /$$__  $$| $$$ | $$| $$_____/|  $$   /$$/        )
 )      | $$   | $$| $$  \\ $$      | $$$$  /$$$$| $$  \\ $$| $$$$| $$| $$       \\  $$ /$$/        ( 
(       |  $$ / $$/| $$  | $$      | $$ $$/$$ $$| $$  | $$| $$ $$ $$| $$$$$     \\  $$$$/          )
 )       \\  $$ $$/ | $$  | $$      | $$  $$$| $$| $$  | $$| $$  $$$$| $$__/      \\  $$/          ( 
(         \\  $$$/  | $$  | $$      | $$\\  $ | $$| $$  | $$| $$\\  $$$| $$          | $$            )
 )         \\  $/   |  $$$$$$/      | $$ \\/  | $$|  $$$$$$/| $$ \\  $$| $$$$$$$$    | $$           ( 
(           \\_/     \\______/       |__/     |__/ \\______/ |__/  \\__/|________/    |__/            )
 )                                                                                               ( 
(                                                                                                 )
 "+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"  

Initializing terminal... [OK]
Loading blog articles... [OK]
System ready.

Type 'help' for available commands.
        `.trim();
        this.printResponse(welcome, 'terminal-welcome');
    }
    
    showHelp() {
        const help = `Available commands:
  help                - Show this help message
  ls                  - List directories and files (simple listing)
  list / list-articles - List all articles with metadata
  cd [dir]            - Change directory (cd .. to go back, cd ~ to go to posts/)
  cat [file]          - View file content (e.g., cat article-1.md)
  search [tag]        - Search articles by tag
  resume / cv         - Display resume/CV
  clear / cls         - Clear terminal
  whoami              - About me
  date                - Current date/time
  pwd                 - Print working directory
  echo [text]         - Echo text
  status              - Show system status and data loading info
  vhs [on|off]        - Toggle VHS overlay effect
  scanlines [on|off]  - Toggle scanlines overlay
  noise [on|off]      - Toggle noise overlay
  exit / quit         - Exit terminal (just kidding, refresh to reset)

Examples:
  ls                    - List contents of current directory (simple)
  list-articles         - List all articles with metadata
  cd security-articles  - Navigate into directory
  cd ..                 - Go back to parent directory
  cat article-1.md      - Read file
  search malware        - Find articles with 'malware' tag
  resume                - View resume
  vhs off               - Disable VHS overlay
  scanlines off         - Disable scanlines overlay
  noise off             - Disable noise overlay`;
        this.printResponse(help);
    }
    
    async listDirectory() {
        // Get files and directories in current path from filesystem
        let directories, files;
        try {
            const contents = await this.getDirectoryContents();
            directories = contents.directories;
            files = contents.files;
        } catch (error) {
            console.error('Error getting directory contents:', error);
            this.printError('Error reading directory contents. Check browser console for details.');
            return;
        }
        
        // Simple directory listing (like real ls)
        let output = '';
        
        // List directories first
        if (directories.length > 0) {
            directories.forEach(dir => {
                output += `${dir}/\n`;
            });
        }
        
        // List files
        if (files.length > 0) {
            files.forEach(file => {
                output += `${this.getFileName(file)}\n`;
            });
        }
        
        if (directories.length === 0 && files.length === 0) {
            output = '(empty directory)\n';
        }
        
        this.printResponse(output.trim());
    }
    
    async listAllArticles() {
        if (!this.blogArticles || this.blogArticles.length === 0) {
            this.printError('No articles found.\n\nPossible issues:\n  - Articles not loaded yet (try refreshing)\n  - data/articles.json file missing or invalid\n  - Check browser console for errors');
            return;
        }
        
        // Get files and directories in current path
        let directories, files;
        try {
            const contents = await this.getDirectoryContents();
            directories = contents.directories;
            files = contents.files;
        } catch (error) {
            console.error('Error getting directory contents:', error);
            this.printError('Error reading directory contents. Check browser console for details.');
            return;
        }
        
        // Count actual articles (files that have article metadata)
        const articlesInCurrentPath = files.filter(file => this.getArticleByFile(file)).length;
        
        // Build relative path display
        let relativePath = this.currentPath;
        if (relativePath.startsWith('posts/')) {
            relativePath = relativePath.substring(6) || '.';
        } else if (relativePath === 'posts') {
            relativePath = '.';
        }
        
        let output = `Articles in ${relativePath}:\n`;
        output += '═'.repeat(60) + '\n';
        output += `Total: ${articlesInCurrentPath} article(s)\n\n`;
        
        // List directories first with article counts
        if (directories.length > 0) {
            directories.forEach((dir, index) => {
                // Count articles in this subdirectory
                const dirPath = this.currentPath === 'posts' ? `posts/${dir}` : `${this.currentPath}/${dir}`;
                const dirArticles = this.blogArticles.filter(article => {
                    if (!article.file) return false;
                    return article.file.startsWith(dirPath + '/');
                });
                output += `  [${String(index + 1).padStart(2, '0')}] ${dir}/\n`;
                output += `      Articles: ${dirArticles.length}\n\n`;
            });
        }
        
        // List files with metadata
        if (files.length > 0) {
            files.forEach((file, index) => {
                const article = this.getArticleByFile(file);
                if (article) {
                    output += `  [${String(directories.length + index + 1).padStart(2, '0')}] ${this.getFileName(file)}\n`;
                    output += `      Title: ${article.title}\n`;
                    output += `      Date:  ${article.date}\n`;
                    output += `      Status: ${article.status || 'published'}\n`;
                    if (article.tags && article.tags.length > 0) {
                        output += `      Tags:  ${article.tags.join(', ')}\n`;
                    }
                    output += '\n';
                } else {
                    output += `  [${String(directories.length + index + 1).padStart(2, '0')}] ${this.getFileName(file)}\n\n`;
                }
            });
        }
        
        if (directories.length === 0 && files.length === 0) {
            output += '  (empty directory)\n\n';
        }
        
        output += '═'.repeat(60) + '\n';
        output += `Directories: ${directories.length} | Files: ${files.length} | Articles: ${articlesInCurrentPath}\n\n`;
        if (directories.length > 0) {
            output += `Use 'cd [directory]' to navigate into a directory.\n`;
        }
        if (files.length > 0) {
            output += `Use 'cat [filename]' to view a file.\n`;
        }
        
        this.printResponse(output);
    }
    
    async getDirectoryContents() {
        const directories = new Set();
        const files = [];
        
        // Normalize current path - get relative path from posts/
        // Security: Always ensure path starts with 'posts/' and filter out path traversal attempts
        let pathParts = [];
        if (this.currentPath === 'posts') {
            pathParts = [];
        } else if (this.currentPath.startsWith('posts/')) {
            pathParts = this.currentPath.substring(6).split('/').filter(p => p && p !== '..' && p !== '.');
        } else {
            pathParts = this.currentPath.split('/').filter(p => p && p !== '..' && p !== '.');
        }
        
        // Security: Rebuild path to ensure it always starts with 'posts/' and has no traversal
        const checkPath = pathParts.length === 0 ? 'posts' : `posts/${pathParts.join('/')}`;
        
        // Try to load a file index first (if it exists)
        // Use cache-busting to ensure we get the latest version
        try {
            const indexResponse = await fetch('data/posts-index.json?' + new Date().getTime());
            if (indexResponse.ok) {
                const index = await indexResponse.json();
                const result = this.getContentsFromIndex(index, pathParts);
                // Always use index results if available (it's the source of truth)
                // Even if empty, it represents the actual filesystem state
                console.log('Loaded from posts-index.json:', result);
                return result;
            } else {
                console.warn('posts-index.json not found or not accessible:', indexResponse.status);
            }
        } catch (e) {
            // Index file doesn't exist or failed to load, continue with discovery
            console.warn('Could not load posts-index.json, falling back to discovery:', e);
        }
        
        // Discover files and directories by checking the filesystem
        const discovered = await this.discoverFilesystem(checkPath, pathParts);
        
        return this.filterDraftContent({
            directories: Array.from(discovered.directories).sort(),
            files: discovered.files.sort()
        });
    }
    
    getContentsFromIndex(index, pathParts) {
        const directories = new Set();
        const files = [];
        
        // Process all files in index
        if (index.files && Array.isArray(index.files)) {
            index.files.forEach(filePath => {
                // Security: Validate file path starts with 'posts/'
                if (!filePath.startsWith('posts/')) {
                    return; // Skip invalid paths
                }
                
                // Remove 'posts/' prefix
                let relativePath = filePath.substring(6);
                
                // Security: Filter out path traversal attempts
                const fileParts = relativePath.split('/').filter(p => p && p !== '..' && p !== '.');
                const fileName = fileParts.pop();
                
                // Check if this file is in the current directory
                if (fileParts.length === pathParts.length) {
                    let pathMatches = true;
                    for (let i = 0; i < pathParts.length; i++) {
                        if (fileParts[i] !== pathParts[i]) {
                            pathMatches = false;
                            break;
                        }
                    }
                    if (pathMatches) {
                        files.push(filePath);
                    }
                } else if (fileParts.length === pathParts.length + 1) {
                    // One level deeper - might be a subdirectory
                    let pathMatches = true;
                    for (let i = 0; i < pathParts.length; i++) {
                        if (fileParts[i] !== pathParts[i]) {
                            pathMatches = false;
                            break;
                        }
                    }
                    if (pathMatches) {
                        const dirName = fileParts[pathParts.length];
                        directories.add(dirName);
                    }
                }
            });
        }
        
        // Process all directories in index
        if (index.directories && Array.isArray(index.directories)) {
            index.directories.forEach(dirPath => {
                // Security: Validate directory path starts with 'posts/'
                if (!dirPath.startsWith('posts/')) {
                    return; // Skip invalid paths
                }
                
                // Remove 'posts/' prefix
                let relativePath = dirPath.substring(6);
                
                // Security: Filter out path traversal attempts
                const dirParts = relativePath.split('/').filter(p => p && p !== '..' && p !== '.');
                
                if (dirParts.length === pathParts.length + 1) {
                    let matches = true;
                    for (let i = 0; i < pathParts.length; i++) {
                        if (dirParts[i] !== pathParts[i]) {
                            matches = false;
                            break;
                        }
                    }
                    if (matches) {
                        directories.add(dirParts[pathParts.length]);
                    }
                } else if (pathParts.length === 0 && dirParts.length === 1) {
                    // Root level directory
                    directories.add(dirParts[0]);
                }
            });
        }
        
        return this.filterDraftContent({
            directories: Array.from(directories).sort(),
            files: files.sort()
        });
    }
    
    async discoverFilesystem(basePath, pathParts) {
        const directories = new Set();
        const files = [];
        
        // Try to fetch posts-index.json again as fallback (in case first attempt failed)
        try {
            const indexResponse = await fetch('data/posts-index.json?' + new Date().getTime());
            if (indexResponse.ok) {
                const index = await indexResponse.json();
                const result = this.getContentsFromIndex(index, pathParts);
                // Use the index data if available
                if (result.directories.length > 0 || result.files.length > 0) {
                    return result;
                }
            }
        } catch (e) {
            // Continue with other discovery methods
        }
        
        // Known directories from articles.json (last resort fallback only)
        // This is kept for backwards compatibility but filesystem index is preferred
        if (this.directories && Array.isArray(this.directories)) {
            this.directories.forEach(dir => {
                if (typeof dir === 'string') {
                    const dirParts = dir.split('/').filter(p => p);
                    
                    if (pathParts.length === 0) {
                        // At root - add root-level directories
                        if (dirParts.length === 1) {
                            directories.add(dirParts[0]);
                        }
                    } else {
                        // In subdirectory - check if this directory is in current path
                        if (dirParts.length === pathParts.length + 1) {
                            let matches = true;
                            for (let i = 0; i < pathParts.length; i++) {
                                if (dirParts[i] !== pathParts[i]) {
                                    matches = false;
                                    break;
                                }
                            }
                            if (matches) {
                                directories.add(dirParts[pathParts.length]);
                            }
                        }
                    }
                }
            });
        }
        
        // Try to discover files by checking common patterns
        // First, check known files from articles.json
        if (this.blogArticles && this.blogArticles.length > 0) {
            this.blogArticles.forEach(article => {
                if (!article.file) return;
                
                // Remove 'posts/' prefix to get relative path
                let filePath = article.file.startsWith('posts/') 
                    ? article.file.substring(6) 
                    : article.file;
                
                const fileParts = filePath.split('/').filter(p => p);
                const fileName = fileParts.pop();
                
                // Check if this file is in the current directory
                if (fileParts.length === pathParts.length) {
                    let pathMatches = true;
                    for (let i = 0; i < pathParts.length; i++) {
                        if (fileParts[i] !== pathParts[i]) {
                            pathMatches = false;
                            break;
                        }
                    }
                    if (pathMatches) {
                        files.push(article.file);
                    }
                } else if (fileParts.length === pathParts.length + 1) {
                    // One level deeper - might be a subdirectory
                    let pathMatches = true;
                    for (let i = 0; i < pathParts.length; i++) {
                        if (fileParts[i] !== pathParts[i]) {
                            pathMatches = false;
                            break;
                        }
                    }
                    if (pathMatches) {
                        const dirName = fileParts[pathParts.length];
                        directories.add(dirName);
                    }
                }
            });
        }
        
        // Try to discover additional files by attempting to fetch them
        // This is a best-effort approach for static sites
        const commonExtensions = ['.md', '.txt', '.html'];
        const commonNames = ['readme', 'index', 'article'];
        
        // For now, we'll rely on the articles.json and directories list
        // A build script could generate posts-index.json for better discovery
        
        return this.filterDraftContent({
            directories: Array.from(directories).sort(),
            files: files.sort()
        });
    }
    
    getFilesInDirectory(dirName) {
        const normalizedPath = this.currentPath.startsWith('posts/') 
            ? this.currentPath 
            : `posts/${this.currentPath === 'posts' ? '' : this.currentPath}`;
        const pathParts = normalizedPath.split('/').filter(p => p);
        pathParts.push(dirName);
        
        return this.blogArticles.filter(article => {
            if (!article.file) return false;
            let filePath = article.file.startsWith('posts/') 
                ? article.file.substring(6) 
                : article.file;
            const fileParts = filePath.split('/').filter(p => p);
            fileParts.pop(); // Remove filename
            
            if (fileParts.length !== pathParts.length) return false;
            for (let i = 0; i < pathParts.length; i++) {
                if (fileParts[i] !== pathParts[i]) return false;
            }
            return true;
        });
    }
    
    getArticleByFile(filePath) {
        return this.blogArticles.find(article => article.file === filePath);
    }

    
    getFileName(filePath) {
        const parts = filePath.split('/');
        return parts[parts.length - 1];
    }
    
    async changeDirectory(path) {
        // Normalize current path
        let currentPathParts = this.currentPath.split('/').filter(p => p);
        if (currentPathParts[0] !== 'posts') {
            currentPathParts = ['posts', ...currentPathParts];
        }
        
        // Support full or nested paths like posts/foo/bar or foo/bar
        if (path.includes('/')) {
            let normalized = path.replace(/^\/+/, '');
            if (normalized.startsWith('posts/')) {
                normalized = normalized.substring(6);
            }

            const parts = normalized.split('/').filter(p => p && p !== '.');
            const originalPath = this.currentPath;
            let nextPath = 'posts';

            for (const part of parts) {
                if (part === '..') {
                    if (nextPath !== 'posts') {
                        const pieces = nextPath.split('/').filter(p => p);
                        pieces.pop();
                        nextPath = pieces.length ? pieces.join('/') : 'posts';
                    }
                    continue;
                }

                this.currentPath = nextPath;
                const { directories } = await this.getDirectoryContents();
                if (!directories.includes(part)) {
                    this.currentPath = originalPath;
                    this.updatePrompt();
                    this.printError(`Directory '${part}' not found.\n\nUse 'ls' to see available directories.`);
                    return;
                }
                nextPath = nextPath === 'posts' ? `posts/${part}` : `${nextPath}/${part}`;
            }

            this.currentPath = nextPath;
            this.updatePrompt();
            this.printResponse(`Changed directory to ${this.currentPath}`);
            return;
        }

        if (path === 'posts') {
            this.currentPath = 'posts';
            this.updatePrompt();
            this.printResponse('Changed directory to posts');
            return;
        }

        if (path === '..') {
            // Go up one directory
            if (currentPathParts.length > 1) {
                currentPathParts.pop();
                this.currentPath = currentPathParts.join('/');
            } else {
                this.currentPath = 'posts';
            }
            this.updatePrompt();
            this.printResponse(`Changed directory to ${this.currentPath}`);
            return;
        }
        
        if (path === '~' || path === '/' || path === '') {
            this.currentPath = 'posts';
            this.updatePrompt();
            this.printResponse(`Changed directory to posts`);
            return;
        }
        
        // Check if directory exists in current path
        const { directories } = await this.getDirectoryContents();
        if (directories.includes(path)) {
            this.currentPath = currentPathParts.join('/') + '/' + path;
            this.updatePrompt();
            this.printResponse(`Changed directory to ${this.currentPath}`);
        } else {
            this.printError(`Directory '${path}' not found.\n\nUse 'ls' to see available directories.`);
        }
    }
    
    getPrompt() {
        return `vomoney@terminal:${this.currentPath}$`;
    }
    
    updatePrompt() {
        const promptElement = document.getElementById('terminal-prompt');
        if (promptElement) {
            promptElement.textContent = this.getPrompt();
            // Apply retro color to prompt
            if (this.retroColors?.prompt) {
                promptElement.style.color = this.retroColors.prompt;
                promptElement.style.textShadow = `0 0 5px ${this.retroColors.prompt}`;
            }
        }
    }
    
    searchTags(query) {
        if (!this.blogArticles || this.blogArticles.length === 0) {
            this.printError('No articles available to search.');
            return;
        }
        
        const searchTerm = query.toLowerCase();
        const matches = this.blogArticles.filter(article => {
            // Search in tags
            if (article.tags && Array.isArray(article.tags)) {
                if (article.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
                    return true;
                }
            }
            
            // Search in title
            if (article.title && article.title.toLowerCase().includes(searchTerm)) {
                return true;
            }
            
            // Search in topic (handle both string and array)
            if (article.topic) {
                if (Array.isArray(article.topic)) {
                    if (article.topic.some(t => String(t).toLowerCase().includes(searchTerm))) {
                        return true;
                    }
                } else if (String(article.topic).toLowerCase().includes(searchTerm)) {
                    return true;
                }
            }
            
            // Search in file path
            if (article.file && article.file.toLowerCase().includes(searchTerm)) {
                return true;
            }
            
            // Search in ID
            if (article.id && article.id.toLowerCase().includes(searchTerm)) {
                return true;
            }
            
            return false;
        });
        
        if (matches.length === 0) {
            this.printResponse(`No articles found matching: ${query}`);
            return;
        }
        
        let output = `Search results for "${query}":\n`;
        output += '═'.repeat(60) + '\n\n';
        
        matches.forEach((article, index) => {
            // Extract directory path from article file
            let directoryPath = '';
            if (article.file) {
                const filePath = article.file.startsWith('posts/') 
                    ? article.file.substring(6) 
                    : article.file;
                const pathParts = filePath.split('/');
                if (pathParts.length > 1) {
                    // Remove filename, keep directory path
                    pathParts.pop();
                    directoryPath = pathParts.join('/');
                } else {
                    directoryPath = '.';
                }
            } else {
                directoryPath = 'unknown';
            }
            
            output += `  [${String(index + 1).padStart(2, '0')}] ${article.id}\n`;
            output += `      Title: ${article.title}\n`;
            output += `      Date:  ${article.date}\n`;
            output += `      Path:  ${directoryPath}\n`;
            if (article.topic) {
                const topicStr = Array.isArray(article.topic) ? article.topic.join(', ') : article.topic;
                output += `      Topic: ${topicStr}\n`;
            }
            if (article.tags && article.tags.length > 0) {
                output += `      Tags:  ${article.tags.join(', ')}\n`;
            }
            output += '\n';
        });
        
        output += '═'.repeat(60) + '\n';
        output += `Found: ${matches.length} article(s)\n\n`;
        output += `Use 'cat [article-id]' to view an article.`;
        
        this.printResponse(output);
    }
    
    async viewArticle(fileIdentifier) {
        let article = null;
        let filePath = null;
        
        // First, try to find by article ID (for backwards compatibility)
        article = this.blogArticles.find(a => a.id === fileIdentifier);
        if (article) {
            filePath = article.file;
        } else {
            // Try to find by filename in current directory
            const { files } = await this.getDirectoryContents();
            const matchingFile = files.find(f => {
                const fileName = this.getFileName(f);
                // Match with or without extension
                return fileName === fileIdentifier || 
                       fileName === `${fileIdentifier}.md` ||
                       fileName.replace('.md', '') === fileIdentifier;
            });
            
            if (matchingFile) {
                filePath = matchingFile;
                // Try to find article metadata for this file
                article = this.getArticleByFile(matchingFile);
            } else {
                // Try to construct path from current directory
                const normalizedPath = this.currentPath.startsWith('posts/') 
                    ? this.currentPath 
                    : `posts/${this.currentPath === 'posts' ? '' : this.currentPath}`;
                
                // Try with .md extension
                const possiblePath = `${normalizedPath}/${fileIdentifier}${fileIdentifier.endsWith('.md') ? '' : '.md'}`;
                filePath = possiblePath;
            }
        }
        
        // Block draft content (hidden)
        if (filePath && this.isFileDraft(filePath)) {
            this.printError(`File '${fileIdentifier}' not found.\n\nUse 'ls' to list available files in the current directory.`);
            return;
        }

        // Try to fetch the file content
        // Encode the file path properly for URLs (encode each segment separately)
        const encodePath = (path) => {
            return path.split('/').map(segment => encodeURIComponent(segment)).join('/');
        };
        const encodedFilePath = encodePath(filePath);
        
        try {
            const response = await fetch(encodedFilePath);
            if (response.ok) {
                const content = await response.text();
                
                // Convert markdown to HTML for better rendering (especially images)
                const htmlContent = this.markdownToHtml(content);
                
                // Create HTML output
                const articleDiv = document.createElement('div');
                articleDiv.className = 'terminal-article-display';
                
                let html = '<div class="terminal-article-content">';
                html += '<div class="terminal-article-header">';
                html += '═'.repeat(60) + '<br>';
                
                if (article) {
                    html += `<h2>${this.escapeHtml(article.title)}</h2>`;
                    html += `<p>Date: ${this.escapeHtml(article.date)} | Tags: ${article.tags.map(t => this.escapeHtml(t)).join(', ')}</p>`;
                } else {
                    html += `<h2>${this.escapeHtml(this.getFileName(filePath))}</h2>`;
                    html += `<p>File: ${this.escapeHtml(filePath)}</p>`;
                }
                
                html += '═'.repeat(60) + '<br>';
                html += '</div>';
                html += '<div class="terminal-article-body">';
                html += htmlContent;
                html += '</div>';
                html += '</div>';
                
                articleDiv.innerHTML = html;
                
                // Render Mermaid diagrams (if any)
                this.renderMermaid(articleDiv);

                // Add click handlers for markdown links
                const articleBody = articleDiv.querySelector('.terminal-article-body');
                if (articleBody) {
                    articleBody.querySelectorAll('a[href*=".md"], a[href*="/posts/"]').forEach(link => {
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            let href = link.getAttribute('href');
                            // Handle both absolute paths (/posts/...) and relative paths
                            if (href.startsWith('/posts/')) {
                                href = href.substring(1); // Remove leading slash to match articles.json format
                            } else if (href.startsWith('/')) {
                                href = href.substring(1);
                            }
                            
                            // Try to find article by file path
                            const linkedArticle = this.blogArticles.find(a => a.file === href);
                            if (linkedArticle) {
                                // Use article ID
                                this.input.value = `cat ${linkedArticle.id}`;
                            } else {
                                // Extract filename from path and try to use it
                                const pathParts = href.split('/');
                                const filename = pathParts[pathParts.length - 1];
                                const fileId = filename.replace('.md', '');
                                this.input.value = `cat ${fileId}`;
                            }
                            
                            this.input.focus();
                            // Trigger the command
                            setTimeout(() => {
                                const event = new KeyboardEvent('keydown', { key: 'Enter' });
                                this.input.dispatchEvent(event);
                            }, 100);
                        });
                    });
                }
                
                // Append to output
                const responseDiv = document.createElement('div');
                responseDiv.className = 'terminal-response';
                responseDiv.appendChild(articleDiv);
                this.output.appendChild(responseDiv);
                this.scrollToBottom();
            } else {
                // File not found
                if (article) {
                    // Show article metadata if file doesn't exist yet
                    let output = '\n';
                    output += '═'.repeat(60) + '\n';
                    output += `${article.title}\n`;
                    output += `Date: ${article.date} | Tags: ${article.tags.join(', ')}\n`;
                    output += '═'.repeat(60) + '\n\n';
                    output += '[Article preview - content file not found]\n\n';
                    output += `File: ${article.file}\n`;
                    output += `ID: ${article.id}\n\n`;
                    output += 'This article is coming soon. Check back later!\n';
                    this.printResponse(output);
                } else {
                    this.printError(`File '${fileIdentifier}' not found.\n\nUse 'ls' to list available files in the current directory.`);
                }
            }
        } catch (error) {
            // Error fetching file
            if (article) {
                // Show article metadata
                let output = '\n';
                output += '═'.repeat(60) + '\n';
                output += `${article.title}\n`;
                output += `Date: ${article.date} | Tags: ${article.tags.join(', ')}\n`;
                output += '═'.repeat(60) + '\n\n';
                output += '[Article preview]\n\n';
                output += `File: ${article.file}\n`;
                output += `ID: ${article.id}\n\n`;
                output += 'Note: Article content will be loaded when file is available.\n';
                this.printResponse(output);
            } else {
                this.printError(`Error reading file '${fileIdentifier}'.\n\nUse 'ls' to list available files in the current directory.`);
            }
        }
    }
    
    getRandomRetroColor() {
        // Retro color palette
        const retroColors = [
            '#ffff00', // Yellow
            '#2121ff', // Blue
            '#ffb8ff', // Pink
            '#00ffff', // Cyan
            '#ffb851'  // Orange
        ];
        return retroColors[Math.floor(Math.random() * retroColors.length)];
    }
    
    showResume() {
        if (this.resumeDraft) {
            this.printError('Resume is not available.');
            return;
        }
        if (!this.resume) {
            this.printError('Resume data not loaded.\n\nPossible issues:\n  - Resume not loaded yet (try refreshing)\n  - data/resume.json or data/resume.md file missing or invalid\n  - Check browser console for errors');
            return;
        }
        
        // Create HTML output for better image support
        const resumeDiv = document.createElement('div');
        resumeDiv.className = 'terminal-resume-display';
        
        let html = '<div class="terminal-resume-content">';
        
        // Header with image
        html += '<div class="terminal-resume-header">';
        const imageStatus = this.resume.imageStatus ? String(this.resume.imageStatus).trim().toLowerCase() : null;
        const imageIsPrivate = this.resume.imagePrivate === true || imageStatus === 'draft';
        if (this.resume.image && !imageIsPrivate) {
            html += `<div class="terminal-resume-image"><img src="${this.escapeHtml(this.resume.image)}" alt="${this.escapeHtml(this.resume.name)}" /></div>`;
        }
        html += `<h2>${this.escapeHtml(this.resume.name.toUpperCase())}</h2>`;
        html += '<p>RESUME / CV</p>';
        html += '</div>';
        
        // Helper function to create a colored section
        const createColoredSection = (title, content) => {
            const sectionColor = this.getRandomRetroColor();
            const borderColor = sectionColor + '66';
            const bgColor = sectionColor + '0d';
            const textColor = sectionColor;
            const titleColor = sectionColor;
            
            return `<div class="terminal-resume-section" style="border-left: 3px solid ${sectionColor}; background: ${bgColor};">
                <h3 style="color: ${titleColor}; text-shadow: 0 0 8px ${titleColor};">${title}</h3>
                <div style="color: ${textColor}; text-shadow: 0 0 3px ${textColor};">${content}</div>
            </div>`;
        };
        
        // Personal Info
        let personalInfoContent = `<p><strong>NAME:</strong> ${this.escapeHtml(this.resume.name)}</p>`;
        personalInfoContent += `<p><strong>EMAIL:</strong> ${this.escapeHtml(this.resume.email)}</p>`;
        if (this.resume.location) {
            personalInfoContent += `<p><strong>LOCATION:</strong> ${this.escapeHtml(this.resume.location)}</p>`;
        }
        html += createColoredSection('PERSONAL INFORMATION', personalInfoContent);
        
        // Summary
        if (this.resume.summary) {
            html += createColoredSection('SUMMARY', `<p>${this.escapeHtml(this.resume.summary)}</p>`);
        }
        
        // Achievements
        if (this.resume.achievements && this.resume.achievements.length > 0) {
            let achievementsContent = '<ul>';
            this.resume.achievements.forEach(achievement => {
                achievementsContent += `<li>${this.escapeHtml(achievement)}</li>`;
            });
            achievementsContent += '</ul>';
            html += createColoredSection('KEY ACHIEVEMENTS', achievementsContent);
        }
        
        // Experience
        if (this.resume.experience && this.resume.experience.length > 0) {
            let experienceContent = '';
            this.resume.experience.forEach(exp => {
                if (typeof exp === 'string') {
                    // Simple string format
                    experienceContent += `<p>• ${this.escapeHtml(exp)}</p>`;
                } else if (typeof exp === 'object') {
                    // Object format with details
                    if (exp.period) experienceContent += `<p><strong>[${this.escapeHtml(exp.period)}]</strong> ${this.escapeHtml(exp.role || '')}</p>`;
                    if (exp.company) experienceContent += `<p>${this.escapeHtml(exp.company)}</p>`;
                    if (exp.details && Array.isArray(exp.details)) {
                        experienceContent += '<ul>';
                        exp.details.forEach(detail => {
                            experienceContent += `<li>${this.escapeHtml(detail)}</li>`;
                        });
                        experienceContent += '</ul>';
                    }
                }
            });
            html += createColoredSection('EXPERIENCE', experienceContent);
        }
        
        // Education
        if (this.resume.education && this.resume.education.length > 0) {
            let educationContent = '';
            this.resume.education.forEach(edu => {
                if (typeof edu === 'string') {
                    educationContent += `<p>• ${this.escapeHtml(edu)}</p>`;
                } else if (typeof edu === 'object') {
                    if (edu.period) educationContent += `<p><strong>[${this.escapeHtml(edu.period)}]</strong> ${this.escapeHtml(edu.degree || '')}</p>`;
                    if (edu.school) educationContent += `<p>${this.escapeHtml(edu.school)}</p>`;
                    if (edu.focus) educationContent += `<p>Focus: ${this.escapeHtml(edu.focus)}</p>`;
                }
            });
            html += createColoredSection('EDUCATION', educationContent);
        }
        
        // Skills
        if (this.resume.skills && Object.keys(this.resume.skills).length > 0) {
            let skillsContent = '';
            Object.entries(this.resume.skills).forEach(([category, items]) => {
                if (items && items.length > 0) {
                    skillsContent += `<p><strong>${this.escapeHtml(category)}:</strong></p>`;
                    skillsContent += '<ul>';
                    items.forEach(item => {
                        skillsContent += `<li>${this.escapeHtml(item)}</li>`;
                    });
                    skillsContent += '</ul>';
                }
            });
            html += createColoredSection('SKILLS', skillsContent);
        }
        
        // Certifications
        if (this.resume.certifications && this.resume.certifications.length > 0) {
            let certificationsContent = '';
            this.resume.certifications.forEach(cert => {
                if (typeof cert === 'string') {
                    // Simple string format (backward compatibility)
                    certificationsContent += `<p>• ${this.escapeHtml(cert)}</p>`;
                } else if (typeof cert === 'object') {
                    // Object format with period, certification, and organization
                    if (cert.period && cert.certification) {
                        certificationsContent += `<p><strong>[${this.escapeHtml(cert.period)}]</strong> ${this.escapeHtml(cert.certification)}</p>`;
                    } else if (cert.certification) {
                        certificationsContent += `<p>• ${this.escapeHtml(cert.certification)}</p>`;
                    }
                    if (cert.organization) {
                        certificationsContent += `<p>${this.escapeHtml(cert.organization)}</p>`;
                    }
                }
            });
            html += createColoredSection('CERTIFICATIONS', certificationsContent);
        }
        
        // Publications
        if (this.resume.publications && this.resume.publications.length > 0) {
            let publicationsContent = '<ul>';
            this.resume.publications.forEach(pub => {
                publicationsContent += `<li>${this.escapeHtml(pub)}</li>`;
            });
            publicationsContent += '</ul>';
            html += createColoredSection('PUBLICATIONS', publicationsContent);
        }
        
        html += '</div>';
        resumeDiv.innerHTML = html;
        
        // Append to output
        const response = document.createElement('div');
        response.className = 'terminal-response';
        response.appendChild(resumeDiv);
        this.output.appendChild(response);
        this.scrollToBottom();
    }
    
    showAbout() {
        // Use about.json if available, otherwise fall back to resume data or defaults
        const name = this.about ? this.about.name : (this.resume ? this.resume.name : 'Unknown');
        const email = this.about ? (this.about.contact?.email || this.about.email) : (this.resume ? this.resume.email : 'contact@example.com');
        const tagline = this.about ? this.about.tagline : 'Cybersecurity researcher and enthusiast exploring the depths of information security.';
        const interests = this.about ? this.about.interests : [
            'Reverse Engineering & Malware Analysis',
            'Exploit Development & Vulnerability Research',
            'Network Security & Penetration Testing',
            'Security Tool Development',
            'Threat Intelligence & Incident Response'
        ];
        const philosophy = this.about ? this.about.philosophy : 'Understanding the attacker\'s mindset is the first step in building effective defenses.';
        const contact = this.about ? this.about.contact : {};
        
        let about = `${name}\n`;
        about += '─'.repeat(60) + '\n';
        about += `${tagline}\n\n`;
        
        if (interests && interests.length > 0) {
            about += 'Interests:\n';
            interests.forEach(interest => {
                about += `  • ${interest}\n`;
            });
            about += '\n';
        }
        
        if (philosophy) {
            about += 'Philosophy:\n';
            // Handle multi-line philosophy
            const philosophyLines = philosophy.split('\n');
            philosophyLines.forEach(line => {
                about += `  "${line.trim()}"\n`;
            });
            about += '\n';
        }
        
        about += 'Contact:\n';
        about += `  Email: ${email}\n`;
        if (contact.github) {
            about += `  GitHub:  ${contact.github}\n`;
        }
        if (contact.linkedin) {
            about += `  LinkedIn: ${contact.linkedin}\n`;
        }
        if (contact.twitter) {
            about += `  Twitter:  ${contact.twitter}\n`;
        }
        if (!contact.github && !contact.linkedin && !contact.twitter) {
            // Fallback to defaults if no contact info
            about += `  GitHub:  github.com/karenvo\n`;
            about += `  Blog:    vo.money\n`;
        }
        
        this.printResponse(about.trim());
    }
    
    showDate() {
        const now = new Date();
        const dateStr = now.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
        this.printResponse(dateStr);
    }
    
    showStatus() {
        const protocol = window.location.protocol;
        const isLocalFile = protocol === 'file:';
        
        let status = 'System Status:\n';
        status += '═'.repeat(60) + '\n\n';
        
        status += `Protocol: ${protocol}\n`;
        if (isLocalFile) {
            status += '⚠ WARNING: Running from file:// protocol\n';
            status += '   Fetch requests may be blocked by browser.\n';
            status += '   Use a local server or GitHub Pages.\n\n';
        }
        
        status += `Articles Loaded: ${this.blogArticles ? this.blogArticles.length : 0}\n`;
        if (this.blogArticles && this.blogArticles.length > 0) {
            status += '  ✓ Articles data loaded successfully\n';
        } else {
            status += '  ✗ No articles loaded\n';
            status += '    Check: data/articles.json exists and is valid JSON\n';
        }
        
        status += `\nResume Loaded: ${this.resume && !this.resumeDraft ? (this.resume.name !== 'Unknown' ? 'Yes' : 'No') : 'No'}\n`;
        if (this.resume && this.resume.name !== 'Unknown' && !this.resumeDraft) {
            status += `  ✓ Resume data loaded for: ${this.resume.name}\n`;
        } else {
            status += '  ✗ Resume not loaded\n';
            status += '    Check: data/resume.json or data/resume.md exists and is valid\n';
        }
        
        status += '\n' + '═'.repeat(60) + '\n';
        status += '\nTip: Open browser console (F12) for detailed error messages.\n';
        
        this.printResponse(status);
    }

    toggleVhs(mode) {
        const body = document.body;
        if (!body) return;

        const normalized = mode ? mode.toLowerCase() : '';
        if (normalized === 'on') {
            body.classList.remove('no-vhs');
        } else if (normalized === 'off') {
            body.classList.add('no-vhs');
        } else {
            body.classList.toggle('no-vhs');
        }

        const enabled = !body.classList.contains('no-vhs');
        this.printResponse(`VHS overlay ${enabled ? 'enabled' : 'disabled'}.`);
    }

    toggleScanlines(mode) {
        const body = document.body;
        if (!body) return;

        const normalized = mode ? mode.toLowerCase() : '';
        if (normalized === 'on') {
            body.classList.remove('no-scanlines');
        } else if (normalized === 'off') {
            body.classList.add('no-scanlines');
        } else {
            body.classList.toggle('no-scanlines');
        }

        const enabled = !body.classList.contains('no-scanlines');
        this.printResponse(`Scanlines ${enabled ? 'enabled' : 'disabled'}.`);
    }

    toggleNoise(mode) {
        const body = document.body;
        if (!body) return;

        const normalized = mode ? mode.toLowerCase() : '';
        if (normalized === 'on') {
            body.classList.remove('no-noise');
        } else if (normalized === 'off') {
            body.classList.add('no-noise');
        } else {
            body.classList.toggle('no-noise');
        }

        const enabled = !body.classList.contains('no-noise');
        this.printResponse(`Noise ${enabled ? 'enabled' : 'disabled'}.`);
    }
    
    clearTerminal() {
        this.output.innerHTML = '';
        this.updatePrompt();
        this.printWelcome();
    }
    
    async autoComplete() {
        const input = this.input.value;
        const parts = input.split(' ');
        const command = parts[0].toLowerCase();
        const arg = parts.slice(1).join(' ') || '';
        
        const commands = ['help', 'ls', 'list', 'cd', 'cat', 'read', 'view', 'search', 'grep', 'find', 'resume', 'cv', 'bio', 'clear', 'cls', 'whoami', 'date', 'pwd', 'echo', 'status', 'exit', 'quit'];
        const commandMatches = commands.filter(cmd => cmd.startsWith(command));
        
        // Autocomplete command name
        if (commandMatches.length === 1 && !arg) {
            this.input.value = commandMatches[0] + ' ';
        } else if (commandMatches.length > 1 && !arg) {
            this.printResponse(`Possible completions: ${commandMatches.join(' ')}`);
        } 
        // Autocomplete arguments for cd command
        else if (command === 'cd' && arg) {
            const { directories } = await this.getDirectoryContents();
            const dirMatches = directories.filter(d => d.toLowerCase().startsWith(arg.toLowerCase()));
            if (dirMatches.length === 1) {
                this.input.value = `cd ${dirMatches[0]}`;
            } else if (dirMatches.length > 1) {
                this.printResponse(`Possible directories: ${dirMatches.join(' ')}`);
            }
        } 
        // Autocomplete arguments for cat/read/view commands (files and article IDs)
        else if ((command === 'cat' || command === 'read' || command === 'view') && arg) {
            const matches = [];
            
            // Get file names from current directory
            try {
                const { files } = await this.getDirectoryContents();
                const fileNames = files.map(f => this.getFileName(f));
                const fileMatches = fileNames.filter(f => f.toLowerCase().startsWith(arg.toLowerCase()));
                matches.push(...fileMatches.map(f => ({ type: 'file', value: f })));
            } catch (e) {
                console.warn('Error getting directory contents for autocomplete:', e);
            }
            
            // Get article IDs from blogArticles
            if (this.blogArticles && this.blogArticles.length > 0) {
                const articleMatches = this.blogArticles
                    .filter(article => article.id && article.id.toLowerCase().startsWith(arg.toLowerCase()))
                    .map(article => ({ type: 'article', value: article.id }));
                matches.push(...articleMatches);
            }
            
            // Remove duplicates (in case filename matches article ID)
            const uniqueMatches = [];
            const seen = new Set();
            for (const match of matches) {
                if (!seen.has(match.value)) {
                    seen.add(match.value);
                    uniqueMatches.push(match.value);
                }
            }
            
            if (uniqueMatches.length === 1) {
                this.input.value = `${command} ${uniqueMatches[0]}`;
            } else if (uniqueMatches.length > 1) {
                this.printResponse(`Possible completions: ${uniqueMatches.join(' ')}`);
            }
        } 
        // Autocomplete arguments for search/grep/find commands (tags, topics, article IDs)
        else if ((command === 'search' || command === 'grep' || command === 'find') && arg) {
            const matches = [];
            
            // Collect all tags and topics from articles
            if (this.blogArticles && this.blogArticles.length > 0) {
                const tags = new Set();
                const topics = new Set();
                const articleIds = [];
                
                this.blogArticles.forEach(article => {
                    if (article.id && article.id.toLowerCase().startsWith(arg.toLowerCase())) {
                        articleIds.push(article.id);
                    }
                    if (article.tags && Array.isArray(article.tags)) {
                        article.tags.forEach(tag => {
                            if (tag.toLowerCase().startsWith(arg.toLowerCase())) {
                                tags.add(tag);
                            }
                        });
                    }
                    if (article.topic) {
                        if (Array.isArray(article.topic)) {
                            article.topic.forEach(t => {
                                if (String(t).toLowerCase().startsWith(arg.toLowerCase())) {
                                    topics.add(t);
                                }
                            });
                        } else if (String(article.topic).toLowerCase().startsWith(arg.toLowerCase())) {
                            topics.add(article.topic);
                        }
                    }
                });
                
                matches.push(...articleIds);
                matches.push(...Array.from(tags));
                matches.push(...Array.from(topics));
            }
            
            // Remove duplicates and sort
            const uniqueMatches = [...new Set(matches)].sort();
            
            if (uniqueMatches.length === 1) {
                this.input.value = `${command} ${uniqueMatches[0]}`;
            } else if (uniqueMatches.length > 1) {
                this.printResponse(`Possible completions: ${uniqueMatches.join(' ')}`);
            }
        }
    }

    normalizeStatus(status) {
        if (!status) return 'published';
        const normalized = String(status).trim().toLowerCase();
        return normalized === 'draft' ? 'draft' : 'published';
    }

    isPublishedArticle(article) {
        if (!article) return false;
        return this.normalizeStatus(article.status) !== 'draft';
    }

    normalizePath(path) {
        if (!path) return '';
        return String(path).replace(/\/+$/, '');
    }

    isPathDraft(path) {
        if (!path || this.draftFolderPaths.length === 0) return false;
        const normalized = this.normalizePath(path);
        return this.draftFolderPaths.some(draftPath => {
            if (!draftPath) return false;
            if (normalized === draftPath) return true;
            return normalized.startsWith(draftPath + '/');
        });
    }

    isFileDraft(filePath) {
        if (!filePath) return false;
        if (this.isPathDraft(filePath)) return true;
        const status = this.articleStatusByFile.get(filePath);
        return this.normalizeStatus(status) === 'draft';
    }

    filterDraftContent(contents) {
        if (!contents) return contents;
        const basePath = this.currentPath.startsWith('posts')
            ? this.currentPath
            : `posts/${this.currentPath}`;

        const directories = (contents.directories || []).filter(dir => {
            const dirPath = basePath === 'posts' ? `posts/${dir}` : `${basePath}/${dir}`;
            return !this.isPathDraft(dirPath);
        });

        const files = (contents.files || []).filter(file => !this.isFileDraft(file));

        return {
            directories,
            files
        };
    }
    
    parseResumeMarkdown(markdown) {
        const lines = markdown.split('\n');
        const resume = {
            name: '',
            email: '',
            location: 'Unknown',
            image: '',
            experience: [],
            education: [],
            skills: {},
            certifications: [],
            publications: []
        };
        
        let currentSection = '';
        let currentSkillCategory = '';
        let currentExperience = null;
        let currentEducation = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines
            if (!line) continue;
            
            // Parse name (first line or after #)
            if (line.startsWith('# ')) {
                resume.name = line.substring(2).trim();
                continue;
            }
            
            // Parse image (markdown format: ![alt](path))
            const imageMatch = line.match(/^!\[.*?\]\((.*?)\)$/);
            if (imageMatch) {
                resume.image = imageMatch[1].trim();
                continue;
            }
            
            // Parse email (handle both **Email:** and Email: formats)
            if (line.match(/^\*\*Email:\*\*/i) || line.match(/^Email:/i)) {
                resume.email = line.replace(/^\*\*Email:\*\*\s*/i, '').replace(/^Email:\s*/i, '').trim();
                continue;
            }
            
            // Section headers (## Summary, ## Skills, etc.)
            if (line.startsWith('## ')) {
                const sectionName = line.substring(3).trim().toLowerCase();
                // Map common section names
                if (sectionName === 'summary' || sectionName === 'achievements') {
                    currentSection = ''; // Skip these for now
                } else {
                    currentSection = sectionName;
                }
                continue;
            }
            
            // Skills section
            if (currentSection === 'skills') {
                if (line.startsWith('### ')) {
                    currentSkillCategory = line.substring(4).trim();
                    resume.skills[currentSkillCategory] = [];
                } else if (line.startsWith('- ') && currentSkillCategory) {
                    const skill = line.substring(2).trim();
                    resume.skills[currentSkillCategory].push(skill);
                }
                continue;
            }
            
            // Certifications section
            if (currentSection === 'certifications') {
                if (line.startsWith('- ')) {
                    resume.certifications.push(line.substring(2).trim());
                }
                continue;
            }
            
            // Experience section
            if (currentSection === 'experience') {
                if (line.startsWith('### ')) {
                    if (currentExperience) {
                        resume.experience.push(currentExperience);
                    }
                    currentExperience = {
                        period: '',
                        role: line.substring(4).trim(),
                        company: '',
                        details: []
                    };
                } else if (line.startsWith('- ') && currentExperience) {
                    currentExperience.details.push(line.substring(2).trim());
                }
                continue;
            }
            
            // Education section
            if (currentSection === 'education') {
                if (line.startsWith('### ')) {
                    if (currentEducation) {
                        resume.education.push(currentEducation);
                    }
                    currentEducation = {
                        year: '',
                        degree: line.substring(4).trim(),
                        school: '',
                        focus: ''
                    };
                }
                continue;
            }
        }
        
        // Push last experience/education if exists
        if (currentExperience) {
            resume.experience.push(currentExperience);
        }
        if (currentEducation) {
            resume.education.push(currentEducation);
        }
        
        return resume;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    markdownToHtml(markdown) {
        if (!markdown) return '';
        if (typeof window.marked === 'undefined') {
            return this.escapeHtml(markdown);
        }

        const normalizeImagePath = (imagePath) => {
            if (!imagePath) return '';
            let normalized = imagePath.trim();
            if (normalized.startsWith('data/images/') || normalized.startsWith('./data/images/')) {
                normalized = normalized.replace('./', '');
            } else if (normalized.startsWith('images/')) {
                normalized = 'data/' + normalized;
            } else if (!normalized.startsWith('http') && !normalized.startsWith('/')) {
                normalized = 'data/images/' + normalized;
            }
            return normalized;
        };

        const buildImageHtml = (alt, path, sizeAttr) => {
            const imagePath = normalizeImagePath(path);
            let className = '';
            let style = '';
            if (sizeAttr) {
                const trimmed = sizeAttr.trim();
                if (trimmed.startsWith('.')) {
                    const classNames = trimmed.split(/\s+/).filter(c => c.startsWith('.')).map(c => c.substring(1));
                    const validClasses = classNames.filter(c => ['small', 'medium', 'large'].includes(c));
                    if (validClasses.length > 0) {
                        className = ` class="${this.escapeHtml(validClasses.join(' '))}"`;
                    }
                } else {
                    const styleParts = [];
                    const attrRegex = /(\w+(?:-\w+)*)\s*=\s*([^\s}]+)/g;
                    let attrMatch;
                    while ((attrMatch = attrRegex.exec(sizeAttr)) !== null) {
                        const prop = attrMatch[1];
                        let value = attrMatch[2];
                        if (/^\d+$/.test(value)) {
                            value = value + 'px';
                        }
                        styleParts.push(`${prop}: ${value}`);
                    }
                    if (styleParts.length > 0) {
                        style = ` style="${this.escapeHtml(styleParts.join('; '))}"`;
                    }
                }
            }

            return `<div class="terminal-article-image"><img src="${this.escapeHtml(imagePath)}" alt="${this.escapeHtml(alt || '')}"${className}${style} /></div>`;
        };

        // Preprocess custom image size syntax
        const preprocessed = markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)\{([^}]+)\}/g, (match, alt, path, sizeAttr) => {
            return buildImageHtml(alt, path, sizeAttr);
        });

        const renderer = new window.marked.Renderer();
        renderer.image = (href, title, text) => {
            const html = buildImageHtml(text, href, null);
            return html;
        };
        renderer.code = (code, infostring) => {
            const language = (infostring || '').trim();
            const langClass = language ? ` language-${this.escapeHtml(language)}` : '';
            return `<pre class="terminal-code-block"><code class="${langClass}">${this.escapeHtml(code)}</code></pre>`;
        };
        renderer.codespan = (code) => {
            return `<code class="terminal-inline-code">${this.escapeHtml(code)}</code>`;
        };
        renderer.link = (href, title, text) => {
            const safeTitle = title ? ` title="${this.escapeHtml(title)}"` : '';
            return `<a href="${this.escapeHtml(href)}"${safeTitle} target="_blank" rel="noopener noreferrer">${text}</a>`;
        };

        window.marked.setOptions({
            gfm: true,
            breaks: false,
            headerIds: false,
            mangle: false,
            renderer
        });

        return window.marked.parse(preprocessed);
    }

    renderMermaid(container) {
        if (!container || typeof window.mermaid === 'undefined') return;

        const mermaidBlocks = container.querySelectorAll('pre code.language-mermaid, pre code.lang-mermaid, pre code.mermaid');
        if (!mermaidBlocks.length) return;

        mermaidBlocks.forEach(block => {
            const pre = block.closest('pre');
            if (!pre) return;
            const diagram = document.createElement('div');
            diagram.className = 'mermaid';
            diagram.textContent = block.textContent || '';
            pre.replaceWith(diagram);
        });

        if (!this.mermaidInitialized) {
            try {
                window.mermaid.initialize({
                    startOnLoad: false,
                    theme: 'dark',
                    securityLevel: 'strict'
                });
                this.mermaidInitialized = true;
            } catch (e) {
                console.warn('Mermaid init failed:', e);
            }
        }

        try {
            window.mermaid.run({ nodes: container.querySelectorAll('.mermaid') });
        } catch (e) {
            console.warn('Mermaid render failed:', e);
        }
    }
    
    scrollToBottom() {
        this.output.scrollTop = this.output.scrollHeight;
    }
    
    addGlitchEffect() {
        // Random glitch effects on terminal
        setInterval(() => {
            if (Math.random() > 0.95) {
                this.triggerGlitch();
            }
        }, 5000);
    }
    
    triggerGlitch() {
        const container = document.querySelector('.terminal-container');
        container.style.animation = 'none';
        setTimeout(() => {
            container.style.animation = 'terminal-glitch 0.3s';
        }, 10);
    }
    
    setupResizeCursor() {
        const container = document.querySelector('.terminal-container');
        if (!container) return;
        
        // Apply border color from retro colors
        if (this.retroColors?.border) {
            container.style.borderColor = this.retroColors.border + '99';
            container.style.boxShadow = `0 4px 20px rgba(0, 0, 0, 0.8), 0 0 30px ${this.retroColors.border}4d`;
        }
        
        // Detect when mouse is near the bottom-right corner (resize area)
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const width = rect.width;
            const height = rect.height;
            
            // Check if mouse is within 20px of bottom-right corner
            const resizeZone = 20;
            const isNearCorner = (x > width - resizeZone && y > height - resizeZone);
            
            if (isNearCorner) {
                container.style.cursor = 'nwse-resize';
            } else {
                container.style.cursor = 'default';
            }
        });
        
        container.addEventListener('mouseleave', () => {
            container.style.cursor = 'default';
        });
    }
    
    setupMinimizeButton() {
        const minimizeBtn = document.getElementById('terminal-minimize-btn');
        const container = document.querySelector('.terminal-container');
        
        if (!minimizeBtn || !container) return;
        
        // Apply button colors from retro colors
        if (this.retroColors?.button) {
            minimizeBtn.style.color = this.retroColors.button;
            minimizeBtn.style.borderColor = this.retroColors.button + '66';
            minimizeBtn.style.textShadow = `0 0 5px ${this.retroColors.button}`;
            minimizeBtn.style.background = `linear-gradient(to bottom, ${this.retroColors.button}1a 0%, rgba(0, 0, 0, 0.3) 100%)`;
        }
        
        if (this.retroColors?.buttonHover) {
            minimizeBtn.addEventListener('mouseenter', () => {
                minimizeBtn.style.background = `linear-gradient(to bottom, ${this.retroColors.buttonHover}33 0%, ${this.retroColors.buttonHover}1a 100%)`;
                minimizeBtn.style.borderColor = this.retroColors.buttonHover + '99';
                minimizeBtn.style.boxShadow = `0 0 8px ${this.retroColors.buttonHover}66`;
            });
            minimizeBtn.addEventListener('mouseleave', () => {
                minimizeBtn.style.background = `linear-gradient(to bottom, ${this.retroColors.button}1a 0%, rgba(0, 0, 0, 0.3) 100%)`;
                minimizeBtn.style.borderColor = this.retroColors.button + '66';
                minimizeBtn.style.boxShadow = 'none';
            });
        }
        
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMinimize();
        });
    }

    setupMaximizeButton() {
        const maximizeBtn = document.getElementById('terminal-maximize-btn');
        const container = document.querySelector('.terminal-container');

        if (!maximizeBtn || !container) return;

        if (this.retroColors?.button) {
            maximizeBtn.style.color = this.retroColors.button;
            maximizeBtn.style.borderColor = this.retroColors.button + '66';
            maximizeBtn.style.textShadow = `0 0 5px ${this.retroColors.button}`;
            maximizeBtn.style.background = `linear-gradient(to bottom, ${this.retroColors.button}1a 0%, rgba(0, 0, 0, 0.3) 100%)`;
        }

        if (this.retroColors?.buttonHover) {
            maximizeBtn.addEventListener('mouseenter', () => {
                maximizeBtn.style.background = `linear-gradient(to bottom, ${this.retroColors.buttonHover}33 0%, ${this.retroColors.buttonHover}1a 100%)`;
                maximizeBtn.style.borderColor = this.retroColors.buttonHover + '99';
                maximizeBtn.style.boxShadow = `0 0 8px ${this.retroColors.buttonHover}66`;
            });
            maximizeBtn.addEventListener('mouseleave', () => {
                maximizeBtn.style.background = `linear-gradient(to bottom, ${this.retroColors.button}1a 0%, rgba(0, 0, 0, 0.3) 100%)`;
                maximizeBtn.style.borderColor = this.retroColors.button + '66';
                maximizeBtn.style.boxShadow = 'none';
            });
        }

        maximizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMaximize();
        });
    }
    
    toggleMinimize() {
        const container = document.querySelector('.terminal-container');
        if (!container) return;
        
        if (container.classList.contains('minimized')) {
            // Restore
            container.classList.remove('minimized');
            container.style.height = container.dataset.originalHeight || '700px';
        } else {
            // Minimize
            container.dataset.originalHeight = container.style.height || getComputedStyle(container).height;
            container.classList.add('minimized');
        }
    }

    toggleMaximize() {
        const container = document.querySelector('.terminal-container');
        if (!container) return;

        if (container.classList.contains('maximized')) {
            container.classList.remove('maximized');
            container.style.position = container.dataset.originalPosition || 'relative';
            container.style.top = container.dataset.originalTop || '';
            container.style.left = container.dataset.originalLeft || '';
            container.style.width = container.dataset.originalWidth || '950px';
            container.style.height = container.dataset.originalHeight || '700px';
            container.style.margin = container.dataset.originalMargin || '50px auto';
        } else {
            container.dataset.originalPosition = getComputedStyle(container).position;
            container.dataset.originalTop = container.style.top || '';
            container.dataset.originalLeft = container.style.left || '';
            container.dataset.originalWidth = container.style.width || '';
            container.dataset.originalHeight = container.style.height || '';
            container.dataset.originalMargin = container.style.margin || '';

            container.classList.add('maximized');
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.left = '20px';
            container.style.width = 'calc(100vw - 40px)';
            container.style.height = 'calc(100vh - 40px)';
            container.style.margin = '0';
        }
    }

    setupDrag() {
        const container = document.querySelector('.terminal-container');
        const header = document.querySelector('.terminal-header');
        if (!container || !header) return;

        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        const startDrag = (e) => {
            if (container.classList.contains('maximized')) return;
            if (e.target.closest('button')) return;

            const rect = container.getBoundingClientRect();
            isDragging = true;
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            container.classList.add('dragging');
            container.style.position = 'fixed';
            container.style.margin = '0';
            e.preventDefault();
        };

        const onDrag = (e) => {
            if (!isDragging) return;
            const left = Math.max(0, Math.min(window.innerWidth - 50, e.clientX - offsetX));
            const top = Math.max(0, Math.min(window.innerHeight - 50, e.clientY - offsetY));
            container.style.left = `${left}px`;
            container.style.top = `${top}px`;
        };

        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            container.classList.remove('dragging');
        };

        header.addEventListener('mousedown', startDrag);
        window.addEventListener('mousemove', onDrag);
        window.addEventListener('mouseup', endDrag);
    }
    
    setupInputCursor() {
        const inputCursor = document.querySelector('.input-cursor');
        if (!inputCursor) return;
        
        // Hide cursor when input loses focus, show when focused
        this.input.addEventListener('focus', () => {
            inputCursor.style.display = 'inline-block';
        });
        
        this.input.addEventListener('blur', () => {
            inputCursor.style.display = 'none';
        });
        
        // Initially show cursor since input is autofocused
        inputCursor.style.display = 'inline-block';
    }
    
    setupRetroColors() {
        // Retro color palette
        const retroColors = [
            '#ffff00', // Yellow
            '#2121ff', // Blue
            '#ffb8ff', // Pink
            '#00ffff', // Cyan
            '#ffb851'  // Orange
        ];
        
        // Randomly select colors for different elements
        const getRandomColor = () => retroColors[Math.floor(Math.random() * retroColors.length)];
        
        // Store color assignments
        this.retroColors = {
            prompt: getRandomColor(),
            command: getRandomColor(),
            response: getRandomColor(),
            welcome: getRandomColor(),
            border: getRandomColor(),
            button: getRandomColor(),
            buttonHover: getRandomColor(),
            title: getRandomColor()
        };
        
        // Apply colors via CSS variables
        const root = document.documentElement;
        root.style.setProperty('--retro-prompt', this.retroColors.prompt);
        root.style.setProperty('--retro-command', this.retroColors.command);
        root.style.setProperty('--retro-response', this.retroColors.response);
        root.style.setProperty('--retro-welcome', this.retroColors.welcome);
        root.style.setProperty('--retro-title', this.retroColors.title);
        
        // Apply to terminal container border
        const container = document.querySelector('.terminal-container');
        if (container) {
            container.style.borderColor = this.retroColors.border + '99';
            container.style.boxShadow = `0 4px 20px rgba(0, 0, 0, 0.8), 0 0 30px ${this.retroColors.border}4d`;
        }
        
        // Apply to terminal title
        const title = document.querySelector('.terminal-title');
        if (title) {
            title.style.color = this.retroColors.title;
            title.style.textShadow = `0 0 10px ${this.retroColors.title}, 0 0 20px ${this.retroColors.title}80, 0 0 30px ${this.retroColors.title}4d`;
        }
        
        // Apply to terminal header border
        const header = document.querySelector('.terminal-header');
        if (header) {
            header.style.borderBottomColor = this.retroColors.border + '4d';
        }
        
        // Apply to input
        const input = document.getElementById('terminal-input');
        if (input) {
            input.style.color = this.retroColors.prompt;
            input.style.caretColor = this.retroColors.prompt;
        }
    }
}

// Typing animation for terminal header
function initTypingAnimation() {
    // Add your quotes and commands here
    const quotes = [
        'contemplating existential crisis :\'\)',
        'thinking...',
        'git add .env && git commit -m "sayonara, all." && git push --force',
        'sudo rm -rf /',
        'echo "hi diddley diddley"',
        'Mercy to your enemies is cruelty to yourself.',
        'My fate is mine to control, not the heavens\'',
        'Talent determines the starting point. Effort determines how far you go. But ruthlessness determines whether you survive.'
    ];
    
    const typingElement = document.getElementById('typing-text');
    const cursorElement = document.querySelector('.terminal-title .blink-cursor');
    if (!typingElement || quotes.length === 0) return;
    
    let currentQuoteIndex = Math.floor(Math.random() * quotes.length);
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100; // milliseconds per character
    let deletingSpeed = 50; // milliseconds per character
    let pauseTime = 2000; // pause time at end of quote
    let cursorVisible = true;
    let cursorInterval = null;
    
    function getRandomQuoteIndex() {
        // Select a random quote, but avoid the same one twice in a row
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * quotes.length);
        } while (newIndex === currentQuoteIndex && quotes.length > 1);
        return newIndex;
    }
    
    function startFastCursorBlink(speed) {
        // Clear any existing cursor animation
        if (cursorInterval) {
            clearInterval(cursorInterval);
        }
        if (cursorElement) {
            cursorElement.style.animation = 'none';
            cursorVisible = true;
            cursorElement.style.opacity = '1';
            
            // Fast blink synchronized with typing
            cursorInterval = setInterval(() => {
                cursorVisible = !cursorVisible;
                cursorElement.style.opacity = cursorVisible ? '1' : '0';
            }, speed / 2); // Blink at half the typing speed for visibility
        }
    }
    
    function startSlowCursorBlink() {
        // Clear fast blink
        if (cursorInterval) {
            clearInterval(cursorInterval);
            cursorInterval = null;
        }
        if (cursorElement) {
            // Use CSS animation for slow blink during pause
            cursorElement.style.animation = 'blink 1s infinite';
            cursorElement.style.opacity = '1';
        }
    }
    
    function type() {
        const currentQuote = quotes[currentQuoteIndex];
        
        if (!isDeleting && currentCharIndex < currentQuote.length) {
            // Typing - fast cursor blink
            startFastCursorBlink(typingSpeed);
            typingElement.textContent = currentQuote.substring(0, currentCharIndex + 1);
            currentCharIndex++;
            setTimeout(type, typingSpeed);
        } else if (isDeleting && currentCharIndex > 0) {
            // Deleting - fast cursor blink
            startFastCursorBlink(deletingSpeed);
            typingElement.textContent = currentQuote.substring(0, currentCharIndex - 1);
            currentCharIndex--;
            setTimeout(type, deletingSpeed);
        } else if (!isDeleting && currentCharIndex === currentQuote.length) {
            // Finished typing, pause then start deleting - slow cursor blink
            startSlowCursorBlink();
            isDeleting = true;
            setTimeout(type, pauseTime);
        } else if (isDeleting && currentCharIndex === 0) {
            // Finished deleting, move to random next quote - slow cursor blink
            startSlowCursorBlink();
            isDeleting = false;
            currentQuoteIndex = getRandomQuoteIndex();
            setTimeout(type, 500); // Brief pause before starting next quote
        }
    }
    
    // Initialize with slow blink
    startSlowCursorBlink();
    
    // Start typing animation
    type();
}

// Initialize CLI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.terminalCLI = new TerminalCLI();
    initTypingAnimation();
});

