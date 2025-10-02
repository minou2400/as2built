<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * Localized language
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'zw_cdbgls3g0ax_eK9g9NHxTxoPAaxJ' );

/** Database username */
define( 'DB_USER', 'zw_cdbgls3g0ax_Lsh1kGXQxvtATq' );

/** Database password */
define( 'DB_PASSWORD', '7EQKkKewIojowqgh26' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',          '|a@/3CN#fS-!c<Kx{fuaCau/8VK;IgA[}B&ISNImd*LDoXHM*1-ixwf@uN/#eE{B' );
define( 'SECURE_AUTH_KEY',   'DV!N] Ro1[Iej,sCoX8n|M@HXt5g!xi#&r}d]In5zLk^+254EgWb@~{a^n,nuYj?' );
define( 'LOGGED_IN_KEY',     '3|i8eF6Q8@R4{g;UdU{8-~>=;L?ruZ(_U3U0.JJ|ms!PyEfoSaO3L#++$j)o$sm>' );
define( 'NONCE_KEY',         'nB>1k_u`2+.+crg5YWK0wvul)b3no8?ZR[TnsKCK*JYkE`Kt2_ _-Dz[,:vPWh;<' );
define( 'AUTH_SALT',         '$Og7%S%yo!3i>2I.(m&I23)& hDS,^O&] $=cSHxdF.tH8>M=0xOTm4P77[ ye&o' );
define( 'SECURE_AUTH_SALT',  '/)y*zNhZWa-*W3#=w:3k9eQ)y^3YikLvIE4L1K^B~|k6Z?m4:7}24^blyY}g^BCc' );
define( 'LOGGED_IN_SALT',    'KHW_4fZ<tsKqlf>&ajl&[`mpajtHeBqq|g&=9<oY]nt%mjmJ>}s7^5^QPV{XdG;5' );
define( 'NONCE_SALT',        'X8?>$~W(8$La{%<sKW:ht%aMto:XaC&A}eS]++B=l+!F+}TNzXwIo7<7+kz|L{#G' );
define( 'WP_CACHE_KEY_SALT', '_wZ^6vnQlu0BwzE2z(}*zcKuq[:r7kOB&X48j&02).)|7jWeF`47Zg5DO!X>*Zb-' );


/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';


/* Add any custom values between this line and the "stop editing" line. */



/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
if ( ! defined( 'WP_DEBUG' ) ) {
	define( 'WP_DEBUG', false );
}

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
