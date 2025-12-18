import React, {createContext} from "react"
import ReactDOM from "react-dom/client"
import App from './App'
import Store from "./store/store.ts"
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

const store = new Store()
export const Context = createContext({
    store,
})

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode value={{store}}>
        <App />
    </React.StrictMode>
)