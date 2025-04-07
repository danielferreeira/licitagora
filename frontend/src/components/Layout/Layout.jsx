import { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Gavel as GavelIcon,
  Description as DescriptionIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  AccountBalance as AccountBalanceIcon,
  Logout as LogoutIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { authService } from '../../services/api';
import { toast } from 'react-toastify';

const drawerWidth = 280;

export default function Layout() {
  const [open, setOpen] = useState(true);
  const [user, setUser] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
      }
    };

    fetchUser();
  }, []);

  // Verificar se usuário é admin
  const isAdmin = user && (user.email === 'admin@licitagora.com' || user.app_metadata?.role === 'admin');

  // Menu principal
  const menuItems = [
    { text: 'Dashboard', icon: <HomeIcon />, path: '/home' },
    { text: 'Clientes', icon: <BusinessIcon />, path: '/clientes' },
    { text: 'Licitações', icon: <GavelIcon />, path: '/licitacoes' },
    { text: 'Documentos', icon: <DescriptionIcon />, path: '/documentos' },
    { text: 'Fechamento', icon: <AssignmentTurnedInIcon />, path: '/fechamento' },
    { text: 'Financeiro', icon: <AccountBalanceIcon />, path: '/financeiro' },
    { text: 'Prazos', icon: <ScheduleIcon />, path: '/prazos' },
    { text: 'Relatórios', icon: <AssessmentIcon />, path: '/relatorios' }
  ];

  // Menu de administração (apenas para admins)
  const adminMenuItems = [
    { text: 'Gerenciar Franquias', icon: <BusinessIcon />, path: '/franquias' },
    { text: 'Gerenciar Permissões', icon: <SecurityIcon />, path: '/permissoes-matriz' }
  ];

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Falha ao fazer logout.');
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.default
      }}
    >
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={isMobile ? handleDrawerToggle : undefined}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            border: 'none',
            transition: 'all 0.3s ease-in-out',
            ...(open ? {
              overflowX: 'hidden',
              backgroundColor: theme.palette.background.paper,
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
            } : {
              width: theme.spacing(7),
              overflowX: 'hidden',
            }),
          },
        }}
      >
        <Toolbar />
        <Box
          sx={{
            overflow: 'hidden auto',
            height: '100%',
            padding: theme.spacing(2),
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setOpen(false);
                }}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  transition: 'all 0.2s ease-in-out',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: location.pathname === item.path ? 'primary.contrastText' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  }}
                />
              </ListItem>
            ))}

            {/* Menu de administração */}
            {isAdmin && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography
                  variant="overline"
                  sx={{
                    px: 3,
                    color: 'text.secondary',
                    fontWeight: 'bold',
                  }}
                >
                  Administração
                </Typography>
                
                {adminMenuItems.map((item) => (
                  <ListItem
                    button
                    key={item.text}
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) setOpen(false);
                    }}
                    selected={location.pathname === item.path}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      transition: 'all 0.2s ease-in-out',
                      '&.Mui-selected': {
                        backgroundColor: 'secondary.light',
                        color: 'secondary.contrastText',
                        '&:hover': {
                          backgroundColor: 'secondary.light',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'secondary.contrastText',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: location.pathname === item.path ? 'secondary.contrastText' : 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: location.pathname === item.path ? 600 : 400,
                      }}
                    />
                  </ListItem>
                ))}
              </>
            )}
          </List>
          
          <Box>
            <Divider sx={{ my: 2 }} />
            {user && (
              <Box sx={{ px: 2, py: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Logado como:
                </Typography>
                <Typography variant="body1" fontWeight={500} noWrap>
                  {user.email}
                </Typography>
              </Box>
            )}
            <Tooltip title="Sair do sistema">
              <ListItem
                button
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'error.light',
                    color: 'error.contrastText',
                    '& .MuiListItemIcon-root': {
                      color: 'error.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Sair" />
              </ListItem>
            </Tooltip>
          </Box>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${open && !isMobile ? drawerWidth : 0}px)`,
          minHeight: '100vh',
          overflow: 'hidden auto',
          backgroundColor: 'background.default',
          transition: 'all 0.3s ease-in-out',
          pt: '64px',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 3 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
} 