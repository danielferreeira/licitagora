import React from 'react';
import { 
  Home as HomeIcon, 
  Settings as SettingsIcon,
  // Remover o ícone de AdminPanelSettings
  // AdminPanelSettings as AdminPanelSettingsIcon,
  // Adicione outros ícones aqui conforme necessário
} from '@mui/icons-material';

// Função para obter os links de navegação
export const getNavigationLinks = (isAdmin = false) => {
  // Links comuns para todos os usuários
  const commonLinks = [
    {
      title: 'Home',
      path: '/home',
      icon: <HomeIcon />,
      adminOnly: false
    },
    // Outros links comuns
  ];

  // Links apenas para administradores
  const adminLinks = [
    // Remover o link para configuração admin
    /*
    {
      title: 'Configuração Admin',
      path: '/admin/config',
      icon: <AdminPanelSettingsIcon />,
      adminOnly: true
    },
    */
    // Outros links de admin
  ];

  // Retorna todos os links se for admin, ou apenas os comuns se não for
  return isAdmin ? [...commonLinks, ...adminLinks] : commonLinks.filter(link => !link.adminOnly);
};

export default getNavigationLinks; 