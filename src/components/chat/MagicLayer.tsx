import React from 'react';
import { ChatPage } from '../../pages/ChatPage';

// Magic Layer is the covert private messaging mode in MIU.
// It is integrated directly into ChatPage which handles AI Chatbot decoy mode and secret command /qupa interception.
export const MagicLayer: React.FC<{ onExit?: () => void }> = () => {
  return <ChatPage />;
};

export default MagicLayer;
