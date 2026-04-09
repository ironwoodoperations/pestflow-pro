import { usePageContent } from '../../../hooks/usePageContent'
import ShellHomeSections from '../ShellHomeSections'

export default function DangHome() {
  const { content } = usePageContent('home')
  // content available for SEO etc; home renders full branded sections
  void content
  return <ShellHomeSections />
}
