export function useFileTheme(filename: string) {
  const extension = filename.split('.').pop();

  switch (extension) {
    case 'ts':
    case 'tsx':
      return { color: '#3178c6', label: 'TypeScript' };
    case 'js':
    case 'jsx':
      return { color: '#f7df1e', label: 'JavaScript' };
    case 'css':
      return { color: '#264de4', label: 'CSS' };
    case 'html':
      return { color: '#e34c26', label: 'HTML' };
    default:
      return { color: '#888', label: 'File' };
  }
}