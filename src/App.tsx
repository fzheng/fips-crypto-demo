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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-quantum-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-quantum-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            PQC Messenger
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Post-quantum encrypted messaging
          </p>
          <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">
            Powered by <a href="https://www.npmjs.com/package/fips-crypto" target="_blank" rel="noopener noreferrer" className="text-quantum-600 dark:text-quantum-400 font-mono underline underline-offset-2 hover:text-quantum-500">fips-crypto</a>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter your name"
            autoFocus
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-quantum-500/50 focus:border-quantum-500"
          />
          <button
            type="submit"
            disabled={!nickname.trim() || isGenerating}
            className="w-full py-3 bg-quantum-500 hover:bg-quantum-600 text-white font-medium rounded-xl transition-colors disabled:opacity-40 shadow-sm"
          >
            {isGenerating ? 'Generating Keys...' : 'Start Chatting'}
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
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
    <div className="h-screen flex flex-col">
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
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center text-gray-400 dark:text-gray-600">
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
