# vomoney - Cybersecurity Research Terminal

A nostalgic 90's themed, liminal blog-like page for cybersecurity research and notes, featuring a pseudo CLI terminal interface.

## Features

- 🖥️ **Retro Terminal Interface** - Authentic 90's terminal experience
- 📝 **Blog Article Management** - List and view cybersecurity research articles
- 📄 **Resume Display** - View resume/CV through terminal commands
- 🎨 **Nostalgic Visual Effects**:
  - CRT scanlines
  - VHS-style glitch effects
  - Neon green/cyan color scheme
  - Kali Linux-style terminal font (DejaVu Sans Mono)
  - Animated borders and glows
- ⌨️ **Interactive CLI** with:
  - Command history (Arrow Up/Down)
  - Tab autocomplete
  - Multiple command aliases
  - Error handling with glitch effects

## Commands

- `help` - Show available commands
- `ls` / `list` / `list-articles` - List blog articles
- `cat [id]` - View article content (e.g., `cat article-1`)
- `resume` / `cv` - Display resume/CV
- `clear` / `cls` - Clear terminal
- `whoami` - About me
- `date` - Current date/time
- `pwd` - Print working directory
- `echo [text]` - Echo text
- `exit` / `quit` - Exit terminal

## Setup for GitHub Pages

1. **Generate the posts index** (required for filesystem-based `ls`):
   ```bash
   node scripts/generate-posts-index.js
   ```

2. Push this repository to GitHub
3. Go to repository Settings > Pages
4. Select source branch (usually `main` or `master`)
5. Your site will be available at `https://[username].github.io/vomoney/`

**Note:** The included GitHub Actions workflow (`.github/workflows/generate-index.yml`) will automatically regenerate `posts-index.json` when files in the `posts/` directory change.

See `SECURITY.md` for security considerations and best practices.

## Customization

### Adding Blog Articles

**Easy Method (Recommended):** Edit `data/articles.json` and add a new entry:

```json
{
  "id": "my-article",
  "title": "My Article Title",
  "date": "2024-01-15",
  "file": "posts/my-article.md",
  "tags": ["tag1", "tag2"]
}
```

Then create the corresponding markdown file in `posts/my-article.md`.

See `data/README.md` for detailed instructions.

### Updating Resume

**Easy Method (Recommended):** Edit `data/resume.json` with your information. No need to touch JavaScript code!

The JSON file contains all your resume data:
- Personal information
- Work experience
- Education
- Skills
- Certifications
- Publications

See `data/README.md` for the complete structure.

### Styling

- Main styles: `assets/css/style.css`
- Terminal CLI styles: `assets/css/cli.css`
- Effects: `assets/js/effects.js`

## Technologies

- Pure HTML/CSS/JavaScript
- No build process required
- GitHub Pages compatible
- Responsive design

## License

MIT License - Feel free to use and modify for your own projects!

---

*Welcome to the liminal space of cybersecurity research.*

