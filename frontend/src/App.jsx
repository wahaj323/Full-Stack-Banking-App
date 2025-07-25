import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './components/Navbar'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfilePage from './pages/ProfilePage'
import TransactionsPage from './pages/TransactionsPage'
import TransferPage from './pages/TransferPage'
import CardPage from './pages/CardPage'
import { useAuthStore } from './store/useAuthStore'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'

function App() {

 const {authUser, checkAuth} = useAuthStore()

 useEffect(() => {
    checkAuth()
 }, [checkAuth])

 console.log(authUser);
 
 

  return (
    <div>
      <Navbar/>
      <Routes>
        <Route path="/" element={authUser? <HomePage  /> : <Navigate to="/login"/>} />
        <Route path="/login" element={!authUser? <LoginPage /> : <Navigate to="/"/>} />
        <Route path="/signup" element={!authUser? <SignupPage /> : <Navigate to="/"/>} />
        <Route path="/profile" element={authUser? <ProfilePage  /> : <Navigate to="/login"/>} />
        <Route path="/transactions" element={authUser? <TransactionsPage  /> : <Navigate to="/login"/>} />
        <Route path="/transfer" element={authUser? <TransferPage  /> : <Navigate to="/login"/>} />
        <Route path="/card" element={authUser? <CardPage  /> : <Navigate to="/login"/>} />
      </Routes>

      <Toaster />
    </div>
  )
}

export default App

