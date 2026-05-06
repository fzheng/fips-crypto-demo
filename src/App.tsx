import { useState, useCallback } from 'react';
import { useIdentityStore } from './store/identity-store';
import { usePeerStore } from './store/peer-store';
import { useSettingsStore, getServerUrl } from './store/settings-store';
import { useWebSocket } from './hooks/useWebSocket';
import ConnectionStatus from './components/ConnectionStatus';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import BenchmarkView from './components/BenchmarkView';
import HowItWorksView from './components/HowItWorksView';

function LoginScreen() {
  const [nickname, setNickname] = useState('');
  const { generate, isGenerating } = useIdentityStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    await generate(nickname.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-[#0A0F1E] dark:via-[#0f1729] dark:to-[#1A0B2E]">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          {/* Shield icon with gradient glow */}
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 opacity-20 blur-xl" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold font-heading gradient-text mb-1">
            PQC Messenger
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Post-quantum encrypted messaging
          </p>
          <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">
            Powered by <a href="https://www.npmjs.com/package/fips-crypto" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-mono underline underline-offset-2 hover:text-blue-500">fips-crypto</a>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter your name"
            autoFocus
            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!nickname.trim() || isGenerating}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-medium rounded-xl transition-all disabled:opacity-40 shadow-sm cursor-pointer hover:shadow-lg hover:shadow-blue-500/20"
          >
            {isGenerating ? 'Generating Keys...' : 'Start Chatting'}
          </button>
          <p className="text-xs text-slate-400 dark:text-slate-600 text-center">
            Generates ML-KEM-768 + ML-DSA-65 keypairs via fips-crypto
          </p>
        </form>
      </div>
    </div>
  );
}

function MainApp() {
  const { connectionState, initiateKeyExchange, sendEncryptedMessage, sendFile } = useWebSocket();
  const activePeerId = usePeerStore((s) => s.activePeerId);
  const setActivePeer = usePeerStore((s) => s.setActivePeer);
  const activeTab = useSettingsStore((s) => s.activeTab);
  const serverUrl = getServerUrl();

  const handleSelectPeer = useCallback(
    (peerId: string) => {
      setActivePeer(peerId);
      useSettingsStore.getState().setActiveTab('chat');
    },
    [setActivePeer],
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#0A0F1E]">
      <ConnectionStatus state={connectionState} serverUrl={serverUrl} />
      <Layout
        sidebar={
          <Sidebar onSelectPeer={handleSelectPeer} onInitiateKE={initiateKeyExchange} />
        }
      >
        {activeTab === 'chat' && activePeerId ? (
          <ChatView peerId={activePeerId} onSendMessage={sendEncryptedMessage} onSendFile={sendFile} />
        ) : activeTab === 'benchmark' ? (
          <BenchmarkView />
        ) : activeTab === 'how-it-works' ? (
          <HowItWorksView />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#0A0F1E]">
            <div className="text-center text-slate-400 dark:text-slate-600">
              <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </Layout>
    </div>
  );
}

export default function App() {
  const identity = useIdentityStore((s) => s.identity);
  return identity ? <MainApp /> : <LoginScreen />;
}
