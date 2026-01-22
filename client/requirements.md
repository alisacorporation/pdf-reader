## Packages
react-pdf | Rendering PDF files client-side (essential for privacy)
react-dropzone | Drag and drop file support
lucide-react | Beautiful icons (already in base, but emphasizing usage)
clsx | Utility for conditional classes
tailwind-merge | Utility for merging tailwind classes

## Notes
Strict privacy requirement: PDF files are never sent to the server.
PDFs are processed client-side using `react-pdf`.
Metadata is stored in `localStorage`.
Preferences are synced to server (optional) but defaults are provided.
