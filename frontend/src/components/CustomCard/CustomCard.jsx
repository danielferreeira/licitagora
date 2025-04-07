import { Card, CardContent, Box, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

export default function CustomCard({
  children,
  onClick,
  showArrow = true,
  elevation = 0,
  sx = {},
  ...props
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card
      elevation={elevation}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: { xs: 2, sm: 3 },
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: isMobile ? 'none' : 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
          '& .arrow-button': {
            opacity: 1,
            transform: 'translateX(0)',
          },
        },
        ...sx,
      }}
      {...props}
    >
      {showArrow && onClick && (
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 4, sm: 8 },
            right: { xs: 4, sm: 8 },
            zIndex: 1,
          }}
        >
          <IconButton
            size={isMobile ? "medium" : "small"}
            onClick={onClick}
            className="arrow-button"
            sx={{
              opacity: isMobile ? 1 : 0,
              transform: 'translateX(-8px)',
              transition: 'all 0.3s ease-in-out',
              backgroundColor: 'background.paper',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              '&:hover': {
                backgroundColor: 'background.paper',
                transform: 'translateX(0)',
              },
            }}
          >
            <ArrowForwardIcon fontSize={isMobile ? "medium" : "small"} />
          </IconButton>
        </Box>
      )}
      <CardContent 
        sx={{ 
          height: '100%', 
          p: { xs: 2, sm: 3 },
          '&:last-child': {
            paddingBottom: { xs: 2, sm: 3 }
          }
        }}
      >
        {children}
      </CardContent>
    </Card>
  );
} 