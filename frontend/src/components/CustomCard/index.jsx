import { Card, CardContent, Box, IconButton } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

export default function CustomCard({
  children,
  onClick,
  showArrow = true,
  elevation = 0,
  sx = {},
  ...props
}) {
  return (
    <Card
      elevation={elevation}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
          '& .arrow-button': {
            opacity: 1,
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
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          <IconButton
            size="small"
            onClick={onClick}
            className="arrow-button"
            sx={{
              opacity: 0,
              transition: 'all 0.2s ease-in-out',
              backgroundColor: 'background.paper',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              '&:hover': {
                backgroundColor: 'background.paper',
                transform: 'translateX(2px)',
              },
            }}
          >
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      <CardContent sx={{ height: '100%', p: 3 }}>{children}</CardContent>
    </Card>
  );
} 