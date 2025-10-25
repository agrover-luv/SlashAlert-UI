import Layout from "./Layout.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

import Dashboard from "./Dashboard";

import AddProduct from "./AddProduct";

import Account from "./Account";

import Reviews from "./Reviews";

import Checkout from "./Checkout";

import CheckoutSuccess from "./CheckoutSuccess";

import AdminDashboard from "./AdminDashboard";

import Home from "./Home";

import ApiTest from "./ApiTest";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    AddProduct: AddProduct,
    
    Account: Account,
    
    Reviews: Reviews,
    
    Checkout: Checkout,
    
    CheckoutSuccess: CheckoutSuccess,
    
    AdminDashboard: AdminDashboard,
    
    Home: Home,
    
    ApiTest: ApiTest,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                
                <Route path="/AddProduct" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
                
                <Route path="/Account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                
                <Route path="/Reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
                
                <Route path="/Checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                
                <Route path="/CheckoutSuccess" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
                
                <Route path="/AdminDashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/ApiTest" element={<ApiTest />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}