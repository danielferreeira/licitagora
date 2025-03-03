import { useState } from 'react';
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
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

export default function Layout({ children }) {
  const [open, setOpen] = useState(true);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Clientes', icon: <BusinessIcon />, path: '/clientes' },
    { text: 'Licitações', icon: <GavelIcon />, path: '/licitacoes' },
    { text: 'Documentos', icon: <DescriptionIcon />, path: '/documentos' },
    { text: 'Prazos', icon: <ScheduleIcon />, path: '/prazos' },
    { text: 'Relatórios', icon: <AssessmentIcon />, path: '/relatorios' },
  ];

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          transition: 'all 0.3s ease-in-out',
          ...(open && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              onClick={handleDrawerToggle}
              edge="start"
              sx={{ mr: 2 }}
            >
              {open ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
            <Typography 
              variant="h5" 
              noWrap 
              component="div"
              sx={{ 
                fontWeight: 600,
                background: 'linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              LicitÁgora
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        open={open}
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
              backgroundColor: theme.palette.background.default,
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
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  transition: 'all 0.2s ease-in-out',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
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
                    color: location.pathname === item.path ? 'primary.main' : 'inherit',
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
          height: '100vh',
          overflow: 'hidden auto',
          backgroundColor: 'background.default',
          transition: 'all 0.3s ease-in-out',
          pt: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
} 