// Simple navigation hook without React Router
export const useNavigate = () => {
  return (path: string) => {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}

