/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { loadProject, saveProject, clearProject } from './lib/db';
import { Project, AssetType, Asset } from './types';
import { parseFileOrText } from './lib/parser';
import { UploadScreen } from './components/UploadScreen';
import { Dashboard } from './components/Dashboard';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadProject().then(p => {
      if (p) setProject(p);
      setLoading(false);
    });
  }, []);

  const handleUpload = async (uploads: { data: File | string, type: AssetType }[]) => {
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
      };
      await saveProject(newProject);
      setProject(newProject);
    } catch (e) {
      console.error(e);
      alert('解析失败，请检查文件格式');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    await saveProject(updatedProject);
    setProject(updatedProject);
  };

  const handleClear = async () => {
    await clearProject();
    setProject(null);
    setShowConfirm(false);
  };

  if (loading) return <div className="flex h-screen items-center justify-center">加载中...</div>;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {project ? (
        <Dashboard project={project} onUpdate={handleUpdateProject} onClear={() => setShowConfirm(true)} />
      ) : (
        <UploadScreen onUpload={handleUpload} />
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold mb-2">重新开始项目</h3>
            <p className="text-neutral-500 mb-6 text-sm">确定要清除当前项目并重新开始吗？所有未保存的进度将丢失，此操作不可逆。</p>
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

