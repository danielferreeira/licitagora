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
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

export default function Layout({ children }) {
  const [open, setOpen] = useState(true);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Clientes', icon: <BusinessIcon />, path: '/clientes' },
    { text: 'Licitações', icon: <GavelIcon />, path: '/licitacoes' },
    { text: 'Documentos', icon: <DescriptionIcon />, path: '/documentos' },
    { text: 'Fechamento', icon: <AssignmentTurnedInIcon />, path: '/fechamento' },
    { text: 'Financeiro', icon: <AccountBalanceIcon />, path: '/financeiro' },
    { text: 'Prazos', icon: <ScheduleIcon />, path: '/prazos' },
    { text: 'Relatórios', icon: <AssessmentIcon />, path: '/relatorios' },
  ];

  const handleDrawerToggle = () => {
    setOpen(!open);
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
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          transition: 'all 0.3s ease-in-out',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          width: '100%',
          ...(open && !isMobile && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
          }),
        }}
      >
      </AppBar>

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
          </List>
          <Divider sx={{ my: 2 }} />
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
        {children}
      </Box>
    </Box>
  );
} 