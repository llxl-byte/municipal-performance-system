import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ProjectsPage from './pages/ProjectsPage'
import UploadPage from './pages/UploadPage'
import TestPage from './pages/TestPage'

function App() {
  return (
    <ConfigProvider 
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AntApp>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/test" element={<TestPage />} />
            </Routes>
          </Layout>
        </Router>
      </AntApp>
    </ConfigProvider>
  )
}

export default App