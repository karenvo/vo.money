// Desktop Icons and Popup Windows Handler

class DesktopManager {
    constructor(cliInstance) {
        this.cli = cliInstance;
        this.folderCurrentPath = 'posts'; // Track current folder path in popup
        this.playlists = [
            { id: 'PLRPoRNBXkkR8Cn9WnZHmNOkxe4E27cobN', label: 'Music' },
            { id: 'PLRPoRNBXkkR8aI4JwqEp1uvSjgbbq8vmO', label: 'Cyber Creations' }
        ];
        this.playlistsStorageKey = 'vomoney.playlists.lastId';
        this.lastPlaylistId = null;
        this.dragState = {
            active: false,
            popup: null,
            startX: 0,
            startY: 0,
            offsetX: 0,
            offsetY: 0
        };
        this.init();
    }
    
    init() {
        // Resume icon click
        const resumeIcon = document.getElementById('resume-icon');
        if (resumeIcon) {
            resumeIcon.addEventListener('click', () => this.openResumePopup());
        }
        
        // Articles icon click
        const articlesIcon = document.getElementById('articles-icon');
        if (articlesIcon) {
            articlesIcon.addEventListener('click', () => this.openArticlesPopup());
        }

        const playlistsIcon = document.getElementById('playlists-icon');
        if (playlistsIcon) {
            playlistsIcon.addEventListener('click', () => this.openPlaylistsPopup());
        }
        
        // Close buttons
        document.querySelectorAll('.popup-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const popupId = e.target.getAttribute('data-popup');
                this.closePopup(popupId);
            });
        });
        
        // Window control buttons (minimize, maximize)
        document.querySelectorAll('.popup-window-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const popup = e.target.closest('.popup-window');
                if (popup) {
                    const text = e.target.textContent.trim();
                    if (text === '−') {
                        // Minimize - just close for now
                        this.closePopup(popup.id);
                    } else if (text === '□') {
                        // Maximize - toggle fullscreen
                        this.toggleMaximize(popup);
                    }
                }
            });
        });

        // Make popup windows draggable by header
        document.querySelectorAll('.popup-header').forEach(header => {
            header.addEventListener('mousedown', (e) => this.startDrag(e, header));
        });

        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', () => this.endDrag());
        
        // Close on overlay click
        const overlay = this.createOverlay();
        overlay.addEventListener('click', () => {
            this.closeAllPopups();
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllPopups();
            }
        });
    }
    
    createOverlay() {
        let overlay = document.querySelector('.popup-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'popup-overlay';
            document.body.appendChild(overlay);
        }
        return overlay;
    }
    
    openResumePopup() {
        const popup = document.getElementById('resume-popup');
        const overlay = this.createOverlay();
        
        if (popup) {
            // Load resume content
            this.loadResumeContent();
            
            popup.style.display = 'flex';
            overlay.classList.add('active');
            
            // Highlight icon
            const icon = document.getElementById('resume-icon');
            if (icon) icon.classList.add('selected');
        }
    }
    
    async openArticlesPopup() {
        const popup = document.getElementById('articles-popup');
        const overlay = this.createOverlay();
        
        if (!popup) {
            console.error('Articles popup element not found');
            return;
        }
        
        // Show popup immediately
        popup.style.display = 'flex';
        overlay.classList.add('active');
        
        // Reset folder path to posts when opening
        this.folderCurrentPath = 'posts';
        
        // Highlight icon
        const icon = document.getElementById('articles-icon');
        if (icon) icon.classList.add('selected');
        
        // Load articles content (will use filesystem data dynamically)
        // This is async but we don't need to wait for it to show the popup
        this.loadArticlesContent().catch(error => {
            console.error('Error loading articles content:', error);
            const content = document.getElementById('articles-content');
            if (content) {
                content.innerHTML = '<div class="loading-text">Error loading articles. Check browser console.</div>';
            }
        });
    }

    openPlaylistsPopup() {
        const popup = document.getElementById('playlists-popup');
        const overlay = this.createOverlay();

        if (popup) {
            popup.style.display = 'flex';
            overlay.classList.add('active');

            const icon = document.getElementById('playlists-icon');
            if (icon) icon.classList.add('selected');

            this.renderPlaylists();
        }
    }
    
    closePopup(popupId) {
        const popup = document.getElementById(popupId);
        const overlay = this.createOverlay();
        
        if (popup) {
            popup.style.display = 'none';
            overlay.classList.remove('active');
            
            // Remove highlight from icons
            document.querySelectorAll('.desktop-icon').forEach(icon => {
                icon.classList.remove('selected');
            });
        }
    }
    
    closeAllPopups() {
        document.querySelectorAll('.popup-window').forEach(popup => {
            popup.style.display = 'none';
        });
        
        const overlay = this.createOverlay();
        overlay.classList.remove('active');
        
        // Remove highlight from icons
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.classList.remove('selected');
        });
    }

    renderPlaylists() {
        const select = document.getElementById('playlist-select');
        const iframe = document.getElementById('playlist-iframe');
        const nowPlaying = document.getElementById('playlist-now-playing');

        if (!select || !iframe || !nowPlaying) {
            console.error('Playlists UI not found');
            return;
        }

        const preferredId = this.getPreferredPlaylistId();
        select.innerHTML = this.playlists.map((playlist) => {
            const selected = playlist.id === preferredId ? ' selected' : '';
            return '<option value="' + this.escapeHtml(playlist.id) + '"' + selected + '>' +
                this.escapeHtml(playlist.label) + '</option>';
        }).join('');

        const active = this.playlists.find(item => item.id === preferredId) || this.playlists[0];
        if (active) {
            const currentSrc = iframe.getAttribute('src') || '';
            const expected = 'list=' + encodeURIComponent(active.id);
            if (!currentSrc.includes(expected)) {
                this.updatePlaylistEmbed(active.id, active.label);
            } else {
                nowPlaying.textContent = 'Now playing: ' + active.label;
            }
        } else {
            iframe.removeAttribute('src');
            nowPlaying.textContent = 'No playlists configured';
        }

        select.onchange = (event) => {
            const playlistId = event.target.value;
            const playlist = this.playlists.find(item => item.id === playlistId);
            this.updatePlaylistEmbed(playlistId, playlist ? playlist.label : 'Playlist');
        };
    }

    updatePlaylistEmbed(playlistId, label) {
        const iframe = document.getElementById('playlist-iframe');
        const nowPlaying = document.getElementById('playlist-now-playing');

        if (!iframe || !nowPlaying) return;

        this.lastPlaylistId = playlistId;
        this.savePreferredPlaylist(playlistId);
        const src = 'https://www.youtube.com/embed/videoseries?list=' + encodeURIComponent(playlistId);
        iframe.setAttribute('src', src);
        nowPlaying.textContent = 'Now playing: ' + label;
    }

    getPreferredPlaylistId() {
        if (this.lastPlaylistId) return this.lastPlaylistId;
        try {
            return window.localStorage.getItem(this.playlistsStorageKey);
        } catch (error) {
            return null;
        }
    }

    savePreferredPlaylist(playlistId) {
        try {
            window.localStorage.setItem(this.playlistsStorageKey, playlistId);
        } catch (error) {
            // Ignore storage errors (private mode, etc.)
        }
    }

    startDrag(event, header) {
        const popup = header.closest('.popup-window');
        if (!popup || popup.classList.contains('maximized')) return;

        const rect = popup.getBoundingClientRect();
        this.dragState.active = true;
        this.dragState.popup = popup;
        this.dragState.startX = event.clientX;
        this.dragState.startY = event.clientY;
        this.dragState.offsetX = event.clientX - rect.left;
        this.dragState.offsetY = event.clientY - rect.top;

        popup.style.left = rect.left + 'px';
        popup.style.top = rect.top + 'px';
        popup.style.transform = 'none';
    }

    onDrag(event) {
        if (!this.dragState.active || !this.dragState.popup) return;

        const popup = this.dragState.popup;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const rect = popup.getBoundingClientRect();

        let nextLeft = event.clientX - this.dragState.offsetX;
        let nextTop = event.clientY - this.dragState.offsetY;

        const maxLeft = Math.max(0, viewportWidth - rect.width);
        const maxTop = Math.max(0, viewportHeight - rect.height);

        if (nextLeft < 0) nextLeft = 0;
        if (nextTop < 0) nextTop = 0;
        if (nextLeft > maxLeft) nextLeft = maxLeft;
        if (nextTop > maxTop) nextTop = maxTop;

        popup.style.left = nextLeft + 'px';
        popup.style.top = nextTop + 'px';
    }

    endDrag() {
        this.dragState.active = false;
        this.dragState.popup = null;
    }
    
    loadResumeContent() {
        const content = document.getElementById('resume-content');
        if (!content) {
            console.error('Resume content container not found');
            return;
        }
        
        // Wait for CLI to load resume data
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
        const checkResume = setInterval(() => {
            attempts++;
            if (this.cli && this.cli.resume && this.cli.resume.name !== 'Unknown' && !this.cli.resumeDraft) {
                clearInterval(checkResume);
                console.log('Resume loaded, rendering with data:', this.cli.resume);
                this.renderResume(this.cli.resume, content);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkResume);
                if (!this.cli) {
                    content.innerHTML = '<div class="loading-text">Terminal not initialized. Please refresh the page.</div>';
                } else if (this.cli.resumeDraft) {
                    content.innerHTML = '<div class="loading-text">Resume not available.</div>';
                } else if (!this.cli.resume || this.cli.resume.name === 'Unknown') {
                    content.innerHTML = '<div class="loading-text">Failed to load resume. Please try refreshing the page.</div>';
                } else {
                    // Resume exists but might be loading
                    this.renderResume(this.cli.resume, content);
                }
            }
        }, 100);
    }
    
    async loadArticlesContent() {
        const content = document.getElementById('articles-content');
        if (!content) {
            console.error('Articles content container not found');
            return;
        }
        
        if (!this.cli) {
            content.innerHTML = '<div class="loading-text">Terminal not initialized. Please refresh the page.</div>';
            return;
        }
        
        // Wait for CLI to be ready, but don't wait too long
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
        while (attempts < maxAttempts) {
            if (this.cli && this.cli.blogArticles !== undefined) {
                // CLI is ready, render immediately
                try {
                    await this.renderArticles(this.cli.blogArticles || [], content);
                    return; // Success, exit
                } catch (error) {
                    console.error('Error rendering articles:', error);
                    content.innerHTML = '<div class="loading-text">Error rendering articles. Check browser console.</div>';
                    return;
                }
            }
            // Wait a bit before checking again
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // Timeout reached
        if (!this.cli) {
            content.innerHTML = '<div class="loading-text">Terminal not initialized. Please refresh the page.</div>';
        } else if (this.cli.blogArticles === undefined) {
            content.innerHTML = '<div class="loading-text">Failed to load articles data. Please try refreshing the page.</div>';
        } else {
            // Articles array exists but might be empty - render anyway
            try {
                await this.renderArticles(this.cli.blogArticles || [], content);
            } catch (error) {
                console.error('Error rendering articles:', error);
                content.innerHTML = '<div class="loading-text">Error rendering articles. Check browser console.</div>';
            }
        }
    }
    
    renderResume(resume, container) {
        if (!resume || resume.name === 'Unknown' || (this.cli && this.cli.resumeDraft)) {
            container.innerHTML = '<div class="loading-text">Resume data not available.</div>';
            return;
        }
        
        console.log('Rendering resume with image:', resume.image);
        
        let html = '<div class="retro-purple-resume">';
        
        // Retro Purple Header
        html += '<div class="rp-header">';
        const imageStatus = resume.imageStatus ? String(resume.imageStatus).trim().toLowerCase() : null;
        const imageIsPrivate = resume.imagePrivate === true || imageStatus === 'draft';

        if (resume.image && !imageIsPrivate) {
            const imagePath = resume.image.startsWith('http') ? resume.image : resume.image;
            html += '<div class="rp-image-container">';
            html += '<img src="' + this.escapeHtml(imagePath) + '" alt="' + this.escapeHtml(resume.name) + '" class="rp-profile-image" onerror="console.error(\'Failed to load image:\', this.src)" />';
            html += '</div>';
        } else if (resume.image && imageIsPrivate) {
            console.log('Resume image hidden due to draft/private status.');
        } else {
            console.warn('Resume image not found in resume data');
        }
        html += '<div class="rp-title">' + this.escapeHtml(resume.name.toUpperCase()) + '</div>';
        html += '<div class="rp-subtitle">RESUME / CV</div>';
        html += '</div>';
        
        // Personal Info Section
        html += '<div class="rp-section">';
        html += '<div class="rp-section-title">PERSONAL INFORMATION</div>';
        html += '<div class="rp-info-grid">';
        html += '<div class="rp-info-item"><span class="rp-label">NAME:</span> <span class="rp-value">' + this.escapeHtml(resume.name) + '</span></div>';
        html += '<div class="rp-info-item"><span class="rp-label">EMAIL:</span> <span class="rp-value">' + this.escapeHtml(resume.email) + '</span></div>';
        if (resume.location) {
            html += '<div class="rp-info-item"><span class="rp-label">LOCATION:</span> <span class="rp-value">' + this.escapeHtml(resume.location) + '</span></div>';
        }
        html += '</div>';
        html += '</div>';
        
        // Fields to skip (handled specially above)
        const skipFields = new Set(['name', 'email', 'location', 'image']);
        
        // Custom renderers for complex structured fields
        const customRenderers = {
            summary: (value) => {
                if (!value) return '';
                return '<div class="rp-section">' +
                       '<div class="rp-section-title">SUMMARY</div>' +
                       '<div class="rp-summary">' + this.escapeHtml(value) + '</div>' +
                       '</div>';
            },
            
            achievements: (value) => {
                if (!value || !Array.isArray(value) || value.length === 0) return '';
                let section = '<div class="rp-section">' +
                             '<div class="rp-section-title">KEY ACHIEVEMENTS</div>' +
                             '<ul class="rp-list">';
                value.forEach(achievement => {
                    section += '<li>' + this.escapeHtml(achievement) + '</li>';
                });
                section += '</ul></div>';
                return section;
            },
            
            experience: (value) => {
                if (!value || !Array.isArray(value) || value.length === 0) return '';
                let section = '<div class="rp-section">' +
                             '<div class="rp-section-title">EXPERIENCE</div>';
                value.forEach(exp => {
                    section += '<div class="rp-item">';
                    section += '<div class="rp-item-header">';
                    if (exp.period) {
                        section += '<span class="rp-item-period">[' + this.escapeHtml(exp.period) + ']</span>';
                    }
                    if (exp.role) {
                        section += '<span class="rp-item-title">' + this.escapeHtml(exp.role) + '</span>';
                    }
                    section += '</div>';
                    if (exp.company) {
                        section += '<div class="rp-item-company">' + this.escapeHtml(exp.company) + '</div>';
                    }
                    if (exp.details && exp.details.length > 0) {
                        section += '<ul class="rp-item-details">';
                        exp.details.forEach(detail => {
                            section += '<li>' + this.escapeHtml(detail) + '</li>';
                        });
                        section += '</ul>';
                    }
                    section += '</div>';
                });
                section += '</div>';
                return section;
            },
            
            education: (value) => {
                if (!value || !Array.isArray(value) || value.length === 0) return '';
                let section = '<div class="rp-section">' +
                             '<div class="rp-section-title">EDUCATION</div>';
                value.forEach(edu => {
                    section += '<div class="rp-item">';
                    section += '<div class="rp-item-header">';
                    if (edu.period) {
                        section += '<span class="rp-item-period">[' + this.escapeHtml(edu.period) + ']</span>';
                    }
                    if (edu.degree) {
                        section += '<span class="rp-item-title">' + this.escapeHtml(edu.degree) + '</span>';
                    }
                    section += '</div>';
                    if (edu.school) {
                        section += '<div class="rp-item-company">' + this.escapeHtml(edu.school) + '</div>';
                    }
                    if (edu.focus) {
                        section += '<div class="rp-item-focus">Focus: ' + this.escapeHtml(edu.focus) + '</div>';
                    }
                    section += '</div>';
                });
                section += '</div>';
                return section;
            },
            
            skills: (value) => {
                if (!value || typeof value !== 'object' || Object.keys(value).length === 0) return '';
                let section = '<div class="rp-section">' +
                             '<div class="rp-section-title">SKILLS</div>' +
                             '<div class="rp-skills-grid">';
                Object.entries(value).forEach(([category, items]) => {
                    if (items && Array.isArray(items) && items.length > 0) {
                        section += '<div class="rp-skill-category">';
                        section += '<div class="rp-skill-category-title">' + this.escapeHtml(category.toUpperCase()) + ':</div>';
                        section += '<div class="rp-skill-items">';
                        items.forEach(item => {
                            section += '<span class="rp-skill-badge">' + this.escapeHtml(item) + '</span>';
                        });
                        section += '</div></div>';
                    }
                });
                section += '</div></div>';
                return section;
            },
            
            certifications: (value) => {
                if (!value || !Array.isArray(value) || value.length === 0) return '';
                let section = '<div class="rp-section">' +
                             '<div class="rp-section-title">CERTIFICATIONS</div>';
                value.forEach(cert => {
                    if (typeof cert === 'string') {
                        section += '<div class="rp-item">';
                        section += '<div class="rp-item-title">' + this.escapeHtml(cert) + '</div>';
                        section += '</div>';
                    } else if (typeof cert === 'object') {
                        section += '<div class="rp-item">';
                        section += '<div class="rp-item-header">';
                        if (cert.period) {
                            section += '<span class="rp-item-period">[' + this.escapeHtml(cert.period) + ']</span>';
                        }
                        if (cert.certification) {
                            section += '<span class="rp-item-title">' + this.escapeHtml(cert.certification) + '</span>';
                        }
                        section += '</div>';
                        if (cert.organization) {
                            section += '<div class="rp-item-company">' + this.escapeHtml(cert.organization) + '</div>';
                        }
                        section += '</div>';
                    }
                });
                section += '</div>';
                return section;
            },
            
            speaking: (value) => {
                if (!value || !Array.isArray(value) || value.length === 0) return '';
                let section = '<div class="rp-section">' +
                             '<div class="rp-section-title">SPEAKING</div>' +
                             '<ul class="rp-list">';
                value.forEach(speak => {
                    if (typeof speak === 'string') {
                        section += '<li>' + this.escapeHtml(speak) + '</li>';
                    } else if (typeof speak === 'object') {
                        let item = '';
                        if (speak.event) item += this.escapeHtml(speak.event);
                        if (speak.title) {
                            if (item) item += ' - ';
                            item += this.escapeHtml(speak.title);
                        }
                        if (speak.description) {
                            item += '<div class="rp-item-description">' + this.escapeHtml(speak.description) + '</div>';
                        }
                        section += '<li>' + item + '</li>';
                    }
                });
                section += '</ul></div>';
                return section;
            },
            
            publications: (value) => {
                if (!value || !Array.isArray(value) || value.length === 0) return '';
                let section = '<div class="rp-section">' +
                             '<div class="rp-section-title">PUBLICATIONS</div>' +
                             '<ul class="rp-list">';
                value.forEach(pub => {
                    section += '<li>' + this.escapeHtml(pub) + '</li>';
                });
                section += '</ul></div>';
                return section;
            }
        };
        
        // Render fields in a specific order for known fields, then render any remaining fields
        const knownFieldOrder = ['summary', 'achievements', 'experience', 'education', 'skills', 
                                'certifications', 'publications', 'speaking'];
        const renderedFields = new Set();
        
        // Render known fields in order
        knownFieldOrder.forEach(fieldName => {
            if (resume[fieldName] !== undefined && !skipFields.has(fieldName)) {
                if (customRenderers[fieldName]) {
                    html += customRenderers[fieldName](resume[fieldName]);
                }
                renderedFields.add(fieldName);
            }
        });
        
        // Render any remaining fields dynamically
        Object.keys(resume).forEach(fieldName => {
            if (skipFields.has(fieldName) || renderedFields.has(fieldName)) {
                return; // Skip already rendered or special fields
            }
            
            const value = resume[fieldName];
            if (value === null || value === undefined) {
                return; // Skip null/undefined values
            }
            
            // Convert field name to title (camelCase to Title Case)
            const title = fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim().toUpperCase();
            
            if (Array.isArray(value)) {
                // Array of items
                if (value.length === 0) return;
                
                html += '<div class="rp-section">';
                html += '<div class="rp-section-title">' + this.escapeHtml(title) + '</div>';
                
                // Check if array contains objects or strings
                const isObjectArray = value.length > 0 && typeof value[0] === 'object' && value[0] !== null;
                
                if (isObjectArray) {
                    // Generic object array renderer
                    value.forEach(item => {
                        html += '<div class="rp-item">';
                        html += '<div class="rp-item-header">';
                        
                        // Try to find common fields
                        if (item.period) {
                            html += '<span class="rp-item-period">[' + this.escapeHtml(item.period) + ']</span>';
                        }
                        if (item.title || item.name || item.label) {
                            html += '<span class="rp-item-title">' + this.escapeHtml(item.title || item.name || item.label) + '</span>';
                        }
                        html += '</div>';
                        
                        if (item.description || item.details) {
                            html += '<div class="rp-item-company">' + this.escapeHtml(item.description || item.details) + '</div>';
                        }
                        
                        // Render any other fields
                        Object.keys(item).forEach(key => {
                            if (!['period', 'title', 'name', 'label', 'description', 'details'].includes(key)) {
                                html += '<div class="rp-item-focus">' + 
                                       this.escapeHtml(key.charAt(0).toUpperCase() + key.slice(1) + ': ') + 
                                       this.escapeHtml(item[key]) + '</div>';
                            }
                        });
                        
                        html += '</div>';
                    });
                } else {
                    // Array of strings
                    html += '<ul class="rp-list">';
                    value.forEach(item => {
                        html += '<li>' + this.escapeHtml(String(item)) + '</li>';
                    });
                    html += '</ul>';
                }
                html += '</div>';
            } else if (typeof value === 'object') {
                // Object (but not array)
                const keys = Object.keys(value);
                if (keys.length === 0) return;
                
                html += '<div class="rp-section">';
                html += '<div class="rp-section-title">' + this.escapeHtml(title) + '</div>';
                html += '<div class="rp-info-grid">';
                keys.forEach(key => {
                    const itemValue = value[key];
                    if (itemValue !== null && itemValue !== undefined) {
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim().toUpperCase();
                        html += '<div class="rp-info-item">';
                        html += '<span class="rp-label">' + this.escapeHtml(label) + ':</span> ';
                        html += '<span class="rp-value">' + this.escapeHtml(String(itemValue)) + '</span>';
                        html += '</div>';
                    }
                });
                html += '</div></div>';
            } else {
                // Simple value (string, number, boolean)
                html += '<div class="rp-section">';
                html += '<div class="rp-section-title">' + this.escapeHtml(title) + '</div>';
                html += '<div class="rp-summary">' + this.escapeHtml(String(value)) + '</div>';
                html += '</div>';
            }
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            if ((currentLine + word).length <= maxWidth) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [''];
    }
    
    async renderArticles(articles, container) {
        if (!this.cli) {
            container.innerHTML = '<div class="loading-text">Terminal not initialized.</div>';
            return;
        }
        
        // Allow rendering even if articles array is empty (to show folder structure)
        if (!articles) {
            articles = [];
        }
        
        try {
            // Use the folder's current path
            const folderPath = this.folderCurrentPath;
            
            // Save terminal's current path and temporarily switch to folder path
            const savedPath = this.cli.currentPath;
            this.cli.currentPath = folderPath;
            
            // Get directory structure for current folder path
            console.log('Getting directory contents for path:', folderPath);
            const contents = await this.cli.getDirectoryContents();
            const { directories, files } = contents;
            console.log('Directory contents:', { directories, files });
            
            // Restore terminal's original path
            this.cli.currentPath = savedPath;
        
            let html = '';
            
            // Folder view header with back button
            html += '<div class="folder-toolbar">';
            html += '<div class="folder-address-bar">';
            if (folderPath !== 'posts') {
                html += '<button class="folder-back-btn" title="Go back">◄</button>';
            }
            html += '<span class="folder-icon">📁</span>';
            html += '<span class="folder-path">' + this.escapeHtml(folderPath) + '</span>';
            html += '</div>';
            html += '</div>';
            
            // Folder view content area
            html += '<div class="folder-content">';
            
            // List directories first
            if (directories.length > 0) {
                directories.forEach(dir => {
                    html += '<div class="folder-item folder-item-dir" data-type="dir" data-name="' + this.escapeHtml(dir) + '">';
                    html += '<div class="folder-item-icon">📁</div>';
                    html += '<div class="folder-item-name">' + this.escapeHtml(dir) + '</div>';
                    html += '</div>';
                });
            }
            
            // List files
            if (files.length > 0) {
                files.forEach(file => {
                    const article = this.cli.getArticleByFile(file);
                    const fileName = this.cli.getFileName(file);
                    const articleId = article ? article.id : fileName.replace('.md', '');
                    
                    html += '<div class="folder-item folder-item-file" data-type="file" data-article-id="' + this.escapeHtml(articleId) + '">';
                    html += '<div class="folder-item-icon">📄</div>';
                    html += '<div class="folder-item-name">' + this.escapeHtml(fileName) + '</div>';
                    if (article) {
                        html += '<div class="folder-item-details">';
                        html += '<div class="folder-item-size">' + (article.date || '') + '</div>';
                        html += '</div>';
                    }
                    html += '</div>';
                });
            }
            
            if (directories.length === 0 && files.length === 0) {
                html += '<div class="folder-empty">(empty folder)</div>';
            }
            
            html += '</div>';
            
            // Footer with item count
            html += '<div class="folder-status-bar">';
            html += `<span>${directories.length + files.length} object(s)</span>`;
            html += '</div>';
            
            container.innerHTML = html;
            
            // Add back button handler
            const backBtn = container.querySelector('.folder-back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.navigateFolderUp();
                });
            }
            
            // Add click handlers for directories
            container.querySelectorAll('.folder-item-dir').forEach(item => {
                item.addEventListener('dblclick', (e) => {
                    const dirName = e.currentTarget.getAttribute('data-name');
                    this.navigateFolderInto(dirName);
                });
            });
            
            // Add click handlers for files
            container.querySelectorAll('.folder-item-file').forEach(item => {
                item.addEventListener('dblclick', (e) => {
                    const articleId = e.currentTarget.getAttribute('data-article-id');
                    this.openArticleInTerminal(articleId);
                });
            });
        } catch (error) {
            console.error('Error rendering articles:', error);
            console.error('Error stack:', error.stack);
            container.innerHTML = '<div class="loading-text">Error loading folder contents. Check browser console for details.<br>Error: ' + this.escapeHtml(error.message) + '</div>';
        }
    }
    
    async navigateFolderInto(dirName) {
        // Update folder path
        if (this.folderCurrentPath === 'posts') {
            this.folderCurrentPath = `posts/${dirName}`;
        } else {
            this.folderCurrentPath = `${this.folderCurrentPath}/${dirName}`;
        }
        
        // Update terminal
        if (this.cli) {
            const cdTarget = this.folderCurrentPath === 'posts' ? '~' : this.folderCurrentPath;
            this.cli.input.value = `cd ${cdTarget}`;
            this.cli.input.focus();
            setTimeout(() => {
                const event = new KeyboardEvent('keydown', { key: 'Enter' });
                this.cli.input.dispatchEvent(event);
            }, 100);
        }
        
        // Re-render folder view
        const container = document.getElementById('articles-content');
        if (container) {
            await this.renderArticles(this.cli.blogArticles, container);
        }
    }
    
    async navigateFolderUp() {
        if (this.folderCurrentPath === 'posts') {
            return; // Already at root
        }
        
        // Go up one level
        const pathParts = this.folderCurrentPath.split('/');
        pathParts.pop();
        this.folderCurrentPath = pathParts.join('/') || 'posts';
        
        // Update terminal
        if (this.cli) {
            this.cli.input.value = `cd ${this.folderCurrentPath}`;
            this.cli.input.focus();
            setTimeout(() => {
                const event = new KeyboardEvent('keydown', { key: 'Enter' });
                this.cli.input.dispatchEvent(event);
            }, 100);
        }
        
        // Re-render folder view
        const container = document.getElementById('articles-content');
        if (container) {
            await this.renderArticles(this.cli.blogArticles, container);
        }
    }
    
    openArticleInTerminal(articleId) {
        // Close popup
        this.closeAllPopups();
        
        // Simulate typing the command in terminal
        if (this.cli && this.cli.input) {
            this.cli.input.value = `cat ${articleId}`;
            this.cli.input.focus();
            // Trigger the command
            setTimeout(() => {
                const event = new KeyboardEvent('keydown', { key: 'Enter' });
                this.cli.input.dispatchEvent(event);
            }, 100);
        }
    }
    
    toggleMaximize(popup) {
        if (popup.classList.contains('maximized')) {
            popup.classList.remove('maximized');
            popup.style.width = '';
            popup.style.height = '';
            popup.style.top = '50%';
            popup.style.left = '50%';
            popup.style.transform = 'translate(-50%, -50%)';
        } else {
            popup.classList.add('maximized');
            popup.style.width = '95vw';
            popup.style.height = '95vh';
            popup.style.top = '50%';
            popup.style.left = '50%';
            popup.style.transform = 'translate(-50%, -50%)';
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
let desktopManager = null;

function initDesktop() {
    // Wait for CLI to be initialized
    const cliInstance = window.terminalCLI;
    if (cliInstance) {
        desktopManager = new DesktopManager(cliInstance);
    } else {
        // Retry after a short delay
        setTimeout(initDesktop, 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Start initialization after a short delay to ensure CLI is ready
    setTimeout(initDesktop, 300);
    
    // Initialize click counter
    initClickCounter();
});

// Click Counter Feature - Coin Toss
function initClickCounter() {
    let clickCount = 0;
    let lastResetTime = Date.now();
    
    // Reset count every minute
    function resetCount() {
        clickCount = 0;
        lastResetTime = Date.now();
    }
    
    // Check for reset every second
    setInterval(() => {
        const now = Date.now();
        if (now - lastResetTime >= 60000) { // 60 seconds = 1 minute
            resetCount();
        }
    }, 1000);
    
    // Handle clicks on the document
    document.addEventListener('click', (e) => {
        const terminalContainer = document.querySelector('.terminal-container');
        const desktopIcons = document.querySelector('.desktop-icons');
        const popupWindows = document.querySelectorAll('.popup-window');
        const retroFooter = document.querySelector('.retro-footer');
        
        // Check if click is outside terminal and not on interactive elements
        const clickedTerminal = terminalContainer && terminalContainer.contains(e.target);
        const clickedDesktopIcon = desktopIcons && desktopIcons.contains(e.target);
        const clickedPopup = Array.from(popupWindows).some(popup => popup.contains(e.target));
        const clickedFooter = retroFooter && retroFooter.contains(e.target);
        const clickedButton = e.target.tagName === 'BUTTON' || e.target.closest('button');
        
        // Only count clicks outside terminal and not on interactive elements
        if (!clickedTerminal && !clickedDesktopIcon && !clickedPopup && !clickedFooter && !clickedButton) {
            // Check if we need to reset (more than 1 minute since last reset)
            const now = Date.now();
            if (now - lastResetTime >= 60000) {
                resetCount();
            }
            
            clickCount++;
            showClickToken(e.clientX, e.clientY, clickCount);
        }
    });
}

function showClickToken(x, y, count) {
    // Create container for coin and count
    const container = document.createElement('div');
    container.className = 'coin-toss-container';
    
    // Create coin element (no heads/tails, just rotating coin)
    const coin = document.createElement('div');
    coin.className = 'click-coin';
    
    // Create count text element
    const countText = document.createElement('div');
    countText.className = 'click-count';
    countText.textContent = '+' + count;
    
    container.appendChild(coin);
    container.appendChild(countText);
    
    // Position at click location
    container.style.left = x + 'px';
    container.style.top = y + 'px';
    
    // Add to body
    document.body.appendChild(container);
    
    // Trigger animation
    requestAnimationFrame(() => {
        coin.classList.add('active');
        countText.classList.add('active');
    });
    
    // Remove after animation
    setTimeout(() => {
        container.classList.add('fade-out');
        setTimeout(() => {
            container.remove();
        }, 500);
    }, 2000);
}


