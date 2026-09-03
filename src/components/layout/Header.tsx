import { useState } from 'react';
import type { MouseEvent, FormEvent } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Badge,
  Button,
  Tooltip,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search,
  FavoriteBorder,
  ShoppingCartOutlined,
  DarkModeOutlined,
  LightModeOutlined,
  DashboardOutlined,
  ReceiptLongOutlined,
  AdminPanelSettingsOutlined,
  PersonOutline,
  Logout,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { useThemeStore } from '@/store/theme.store';

interface NavItem {
  label: string;
  to: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
];

const Header = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated, isAdmin, signOut } = useAuthStore();
  const itemCount = useCartStore((state) => state.itemCount);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const { isDark, setMode } = useThemeStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    setMobileOpen(false);
    navigate(query ? `/products?q=${encodeURIComponent(query)}` : '/products');
  };

  const openAccountMenu = (event: MouseEvent<HTMLElement>) => {
    setAccountAnchor(event.currentTarget);
  };

  const closeAccountMenu = () => {
    setAccountAnchor(null);
  };

  const handleSignOut = async () => {
    closeAccountMenu();
    await signOut();
    navigate('/');
  };

  const goTo = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const mobileMenu = (
    <Drawer
      anchor="right"
      open={mobileOpen}
      onClose={() => setMobileOpen(false)}
      PaperProps={{ sx: { width: 300 } }}
    >
      <Box sx={{ p: 2 }}>
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search watches..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            InputProps={{
              startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>
        <List component="nav" disablePadding>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.to}
              onClick={() => goTo(item.to)}
              selected={isActive(item.to)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
          <ListItemButton onClick={() => goTo('/wishlist')} selected={isActive('/wishlist')}>
            <ListItemText primary="Wishlist" />
          </ListItemButton>
          <ListItemButton onClick={() => goTo('/cart')} selected={isActive('/cart')}>
            <ListItemText primary="Cart" />
          </ListItemButton>
          {isAuthenticated && (
            <>
              <Divider sx={{ my: 1 }} />
              <ListItemButton onClick={() => goTo('/dashboard')} selected={isActive('/dashboard')}>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
              <ListItemButton
                onClick={() => goTo('/dashboard/orders')}
                selected={isActive('/dashboard/orders')}
              >
                <ListItemText primary="My Orders" />
              </ListItemButton>
              {isAdmin && (
                <ListItemButton onClick={() => goTo('/admin')} selected={isActive('/admin')}>
                  <ListItemText primary="Admin Panel" />
                </ListItemButton>
              )}
              <ListItemButton onClick={handleSignOut}>
                <ListItemText primary="Sign Out" />
              </ListItemButton>
            </>
          )}
        </List>
        {!isAuthenticated && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button fullWidth variant="outlined" onClick={() => goTo('/login')}>
              Sign In
            </Button>
            <Button fullWidth variant="contained" onClick={() => goTo('/register')}>
              Register
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          {/* Brand — a logo/link, not a document heading (keeps axe's
              heading-order rule happy when rendered after <h1> in a drawer
              portal). */}
          <Typography variant="h6" component="span" sx={{ display: 'inline-flex' }}>
            <Box
              component={RouterLink}
              to="/"
              aria-label="Classic Watch Pro home"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'primary.main',
                textDecoration: 'none',
                display: 'inline-flex',
              }}
            >
              Classic Watch Pro
            </Box>
          </Typography>

          {/* Desktop navigation */}
          {isDesktop && (
            <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
              {NAV_ITEMS.map((item) => (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  color={isActive(item.to) ? 'primary' : 'inherit'}
                  sx={{ fontWeight: isActive(item.to) ? 700 : 500 }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop search */}
          {isDesktop && (
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'action.hover',
                borderRadius: 2,
                px: 1.5,
                width: { md: 260, lg: 320 },
              }}
            >
              <Search fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
              <input
                aria-label="Search watches"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search watches..."
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  padding: '10px 0',
                  font: 'inherit',
                  color: 'inherit',
                }}
              />
            </Box>
          )}

          {/* Theme toggle */}
          <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton
              onClick={() => setMode(isDark ? 'light' : 'dark')}
              aria-label="Toggle dark mode"
            >
              {isDark ? <LightModeOutlined /> : <DarkModeOutlined />}
            </IconButton>
          </Tooltip>

          {/* Wishlist */}
          <Tooltip title="Wishlist">
            <IconButton component={RouterLink} to="/wishlist" aria-label="Wishlist">
              <Badge badgeContent={wishlistCount} color="secondary" max={99}>
                <FavoriteBorder />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Cart */}
          <Tooltip title="Cart">
            <IconButton component={RouterLink} to="/cart" aria-label="Cart">
              <Badge badgeContent={itemCount} color="primary" max={99}>
                <ShoppingCartOutlined />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Account */}
          {isAuthenticated && user ? (
            <>
              <Tooltip title="Account">
                <IconButton onClick={openAccountMenu} aria-label="Account menu">
                  <Avatar
                    alt={user.displayName || 'User'}
                    src={user.photoURL}
                    sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}
                  >
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={accountAnchor}
                open={Boolean(accountAnchor)}
                onClose={closeAccountMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap>
                    {user.displayName || 'User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {user.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => goTo('/dashboard')}>
                  <DashboardOutlined fontSize="small" sx={{ mr: 1.5 }} />
                  Dashboard
                </MenuItem>
                <MenuItem onClick={() => goTo('/dashboard/orders')}>
                  <ReceiptLongOutlined fontSize="small" sx={{ mr: 1.5 }} />
                  My Orders
                </MenuItem>
                {isAdmin && (
                  <MenuItem onClick={() => goTo('/admin')}>
                    <AdminPanelSettingsOutlined fontSize="small" sx={{ mr: 1.5 }} />
                    Admin Panel
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleSignOut}>
                  <Logout fontSize="small" sx={{ mr: 1.5 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              {isDesktop && (
                <Button component={RouterLink} to="/login" startIcon={<PersonOutline />}>
                  Sign In
                </Button>
              )}
              {isDesktop && (
                <Button variant="contained" component={RouterLink} to="/register">
                  Register
                </Button>
              )}
            </>
          )}

          {/* Mobile menu trigger */}
          {!isDesktop && (
            <IconButton onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {mobileMenu}
    </>
  );
};

export default Header;
