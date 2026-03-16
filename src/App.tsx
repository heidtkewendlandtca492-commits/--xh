/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { loadProject, saveProject, clearProject, subscribeToProject } from './lib/db';
import { Project, AssetType, Asset } from './types';
import { parseFileOrText } from './lib/parser';
import { UploadScreen } from './components/UploadScreen';
import { Dashboard } from './components/Dashboard';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToProject((p) => {
      setProject(p);
      setLoading(false);
    });

    const preventDefault = (e: Event) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      unsubscribe();
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  const handleUpload = async (uploads: { data: File | string, type: AssetType }[], announcement: string) => {
    setLoading(true);
    try {
      let allAssets: Asset[] = [];
      for (const u of uploads) {
        const assets = await parseFileOrText(u.data, u.type);
        allAssets = [...allAssets, ...assets];
      }
      const newProject: Project = {
        id: uuidv4(),
        scriptText: 'Batch Upload',
        assets: allAssets,
        announcement: announcement,
        clearPassword: 'xwz666'
      };
      setProject(newProject);
      await saveProject(newProject);
    } catch (e) {
      console.error(e);
      alert('解析失败，请检查文件格式');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    setProject(updatedProject);
    // Save to Firestore immediately for real-time sync
    try {
      await saveProject(updatedProject);
    } catch (e) {
      console.error("Failed to save project:", e);
    }
  };

  const handleClear = async () => {
    const expectedPassword = project?.clearPassword || 'xwz666';
    if (clearPassword !== expectedPassword) {
      setPasswordError('密码错误，请重试');
      return;
    }
    
    try {
      await clearProject();
      setProject(null);
      setClearPassword('');
      setPasswordError('');
      alert('项目已重置。注意：云端图片/音频缓存无法在前端直接删除，如需彻底释放云端空间，请在 Cloudinary 后台手动清理。');
    } catch (e) {
      console.error("Failed to clear project:", e);
    } finally {
      setShowConfirm(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">加载中...</div>;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {project ? (
        <Dashboard 
          project={project} 
          onUpdate={handleUpdateProject} 
          onClear={() => {
            setShowConfirm(true);
            setClearPassword('');
            setPasswordError('');
          }} 
        />
      ) : (
        <UploadScreen onUpload={handleUpload} />
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold mb-2">重新开始项目</h3>
            <p className="text-neutral-500 mb-4 text-sm">确定要清除当前项目并重新开始吗？所有未保存的进度将丢失，此操作不可逆。</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-1">请输入密码确认</label>
              <input 
                type="password" 
                value={clearPassword}
                onChange={(e) => {
                  setClearPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="请输入密码"
                className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              />
              {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirm(false)} 
                className="px-5 py-2.5 rounded-xl hover:bg-neutral-100 font-medium transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleClear} 
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors shadow-sm"
              >
                确定清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

