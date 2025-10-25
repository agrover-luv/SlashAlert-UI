import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import ErrorBoundary from '@/components/ErrorBoundary'
import { ApiProvider } from '@/contexts/ApiContext'

function App() {
  return (
    <ErrorBoundary>
      <ApiProvider>
        <Pages />
        <Toaster />
      </ApiProvider>
    </ErrorBoundary>
  )
}

export default App