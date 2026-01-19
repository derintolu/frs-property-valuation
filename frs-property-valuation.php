<?php
/**
 * Plugin Name: FRS Property Valuation
 * Plugin URI: https://myhub21.com
 * Description: Professional property valuation tool powered by Rentcast API. Generates beautiful landing pages with property values, rent estimates, and market statistics.
 * Version: 1.0.0
 * Author: Derin Tolu / FRS Brand Experience Teams
 * Author URI: https://myhub21.com
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: frs-property-valuation
 * Domain Path: /languages
 * Requires at least: 6.4
 * Requires PHP: 8.1
 * Network: true
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'FRS_PV_VERSION', '1.0.0' );
define( 'FRS_PV_DIR', plugin_dir_path( __FILE__ ) );
define( 'FRS_PV_URL', plugin_dir_url( __FILE__ ) );
define( 'FRS_PV_BASENAME', plugin_basename( __FILE__ ) );

/**
 * Main Plugin Class
 */
final class FRS_Property_Valuation {

	private static $instance = null;
	private $api_key;
	private $api_base = 'https://api.rentcast.io/v1';

	public static function get_instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		$this->api_key = defined( 'RENTCAST_API_KEY' )
			? RENTCAST_API_KEY
			: get_option( 'frs_pv_rentcast_api_key', '' );

		$this->init_hooks();
	}

	private function init_hooks(): void {
		register_activation_hook( __FILE__, [ $this, 'activate' ] );
		register_deactivation_hook( __FILE__, [ $this, 'deactivate' ] );

		add_action( 'init', [ $this, 'register_shortcodes' ] );
		add_action( 'rest_api_init', [ $this, 'register_rest_routes' ] );
		add_action( 'admin_menu', [ $this, 'register_admin_menu' ] );
		add_action( 'admin_init', [ $this, 'register_settings' ] );
		add_filter( 'plugin_action_links_' . FRS_PV_BASENAME, [ $this, 'add_settings_link' ] );

		// Add type="module" to our script
		add_filter( 'script_loader_tag', [ $this, 'add_module_type' ], 10, 3 );
	}

	public function activate(): void {
		add_option( 'frs_pv_rentcast_api_key', '' );
	}

	public function deactivate(): void {
		// Nothing to clean up
	}

	/**
	 * Register shortcodes
	 */
	public function register_shortcodes(): void {
		add_shortcode( 'frs_property_valuation', [ $this, 'render_shortcode' ] );
	}

	/**
	 * Render the property valuation shortcode
	 */
	public function render_shortcode( $atts ): string {
		$atts = shortcode_atts( [
			'user_id' => '',
		], $atts, 'frs_property_valuation' );

		$this->enqueue_widget_assets();

		$data_attrs = [];
		if ( ! empty( $atts['user_id'] ) ) {
			$data_attrs[] = 'data-loan-officer-id="' . esc_attr( $atts['user_id'] ) . '"';
		}
		$data_attrs[] = 'data-api-url="' . esc_url( rest_url( 'frs-property-valuation/v1' ) ) . '"';

		return '<div id="frs-pv-root" ' . implode( ' ', $data_attrs ) . '></div>';
	}

	/**
	 * Enqueue widget assets
	 */
	private function enqueue_widget_assets(): void {
		$manifest_path = FRS_PV_DIR . 'assets/dist/manifest.json';
		if ( ! file_exists( $manifest_path ) ) {
			$manifest_path = FRS_PV_DIR . 'assets/dist/.vite/manifest.json';
		}

		if ( ! file_exists( $manifest_path ) ) {
			return;
		}

		$manifest = json_decode( file_get_contents( $manifest_path ), true );
		$entry = $manifest['src/widget/main.tsx'] ?? null;

		if ( ! $entry ) {
			return;
		}

		$base_url = FRS_PV_URL . 'assets/dist/';

		if ( ! empty( $entry['css'] ) ) {
			foreach ( $entry['css'] as $css_file ) {
				wp_enqueue_style( 'frs-property-valuation', $base_url . $css_file, [], FRS_PV_VERSION );
			}
		}

		wp_enqueue_script( 'frs-property-valuation', $base_url . $entry['file'], [], FRS_PV_VERSION, true );
	}

	/**
	 * Add type="module" to our script tag
	 */
	public function add_module_type( string $tag, string $handle, string $src ): string {
		if ( 'frs-property-valuation' !== $handle ) {
			return $tag;
		}
		return str_replace( ' src=', ' type="module" src=', $tag );
	}

	/**
	 * Register REST API routes
	 */
	public function register_rest_routes(): void {
		register_rest_route( 'frs-property-valuation/v1', '/valuation', [
			'methods'             => [ 'GET', 'POST' ],
			'callback'            => [ $this, 'get_valuation' ],
			'permission_callback' => '__return_true',
		] );

		register_rest_route( 'frs-property-valuation/v1', '/rent-estimate', [
			'methods'             => [ 'GET', 'POST' ],
			'callback'            => [ $this, 'get_rent_estimate' ],
			'permission_callback' => '__return_true',
		] );

		register_rest_route( 'frs-property-valuation/v1', '/market-statistics', [
			'methods'             => [ 'GET', 'POST' ],
			'callback'            => [ $this, 'get_market_statistics' ],
			'permission_callback' => '__return_true',
		] );
	}

	/**
	 * Get property valuation from Rentcast
	 */
	public function get_valuation( \WP_REST_Request $request ) {
		$address = $request->get_param( 'address' );
		if ( empty( $address ) ) {
			return new \WP_Error( 'missing_address', 'Property address is required', [ 'status' => 400 ] );
		}

		$query_params = [ 'address' => sanitize_text_field( $address ) ];
		if ( $city = $request->get_param( 'city' ) ) {
			$query_params['city'] = sanitize_text_field( $city );
		}
		if ( $state = $request->get_param( 'state' ) ) {
			$query_params['state'] = sanitize_text_field( $state );
		}
		if ( $zip = $request->get_param( 'zipCode' ) ) {
			$query_params['zipCode'] = sanitize_text_field( $zip );
		}

		$url = add_query_arg( $query_params, $this->api_base . '/avm/value' );
		return $this->make_rentcast_request( $url );
	}

	/**
	 * Get rent estimate from Rentcast
	 */
	public function get_rent_estimate( \WP_REST_Request $request ) {
		$address = $request->get_param( 'address' );
		if ( empty( $address ) ) {
			return new \WP_Error( 'missing_address', 'Property address is required', [ 'status' => 400 ] );
		}

		$query_params = [ 'address' => sanitize_text_field( $address ) ];
		if ( $city = $request->get_param( 'city' ) ) {
			$query_params['city'] = sanitize_text_field( $city );
		}
		if ( $state = $request->get_param( 'state' ) ) {
			$query_params['state'] = sanitize_text_field( $state );
		}
		if ( $zip = $request->get_param( 'zipCode' ) ) {
			$query_params['zipCode'] = sanitize_text_field( $zip );
		}

		$url = add_query_arg( $query_params, $this->api_base . '/avm/rent/long-term' );
		return $this->make_rentcast_request( $url );
	}

	/**
	 * Get market statistics from Rentcast
	 */
	public function get_market_statistics( \WP_REST_Request $request ) {
		$zip = $request->get_param( 'zipCode' );
		if ( empty( $zip ) ) {
			return new \WP_Error( 'missing_zip', 'ZIP code is required', [ 'status' => 400 ] );
		}

		$url = add_query_arg( [ 'zipCode' => sanitize_text_field( $zip ) ], $this->api_base . '/markets' );
		return $this->make_rentcast_request( $url );
	}

	/**
	 * Make request to Rentcast API
	 */
	private function make_rentcast_request( string $url ) {
		if ( empty( $this->api_key ) ) {
			return new \WP_Error( 'missing_api_key', 'Rentcast API key is not configured', [ 'status' => 500 ] );
		}

		$response = wp_remote_get( $url, [
			'headers' => [
				'X-Api-Key' => $this->api_key,
				'Accept'    => 'application/json',
			],
			'timeout' => 30,
		] );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( $status_code !== 200 ) {
			$error_message = $data['message'] ?? 'Rentcast API request failed';
			return new \WP_Error( 'rentcast_api_error', $error_message, [ 'status' => $status_code ] );
		}

		return new \WP_REST_Response( $data, 200 );
	}

	/**
	 * Admin menu and settings
	 */
	public function register_admin_menu(): void {
		add_options_page(
			__( 'Property Valuation', 'frs-property-valuation' ),
			__( 'Property Valuation', 'frs-property-valuation' ),
			'manage_options',
			'frs-property-valuation',
			[ $this, 'render_settings_page' ]
		);
	}

	public function register_settings(): void {
		register_setting( 'frs_pv_settings', 'frs_pv_rentcast_api_key', [
			'sanitize_callback' => 'sanitize_text_field',
		] );
	}

	public function add_settings_link( array $links ): array {
		$settings_link = sprintf(
			'<a href="%s">%s</a>',
			admin_url( 'options-general.php?page=frs-property-valuation' ),
			__( 'Settings', 'frs-property-valuation' )
		);
		array_unshift( $links, $settings_link );
		return $links;
	}

	public function render_settings_page(): void {
		include FRS_PV_DIR . 'admin/views/settings.php';
	}

	public function get_api_key(): string {
		return $this->api_key;
	}

	public function is_configured(): bool {
		return ! empty( $this->api_key );
	}
}

function frs_property_valuation(): FRS_Property_Valuation {
	return FRS_Property_Valuation::get_instance();
}

frs_property_valuation();

/**
 * Global helper for property lookup via Rentcast API
 *
 * This function is used by frs-lead-pages to lookup property details.
 * Returns property data from Rentcast or WP_Error on failure.
 *
 * @param string $address Property address to lookup.
 * @return array|WP_Error Property data or error.
 */
function lrh_rentcast_property_lookup( string $address ) {
	$plugin = frs_property_valuation();

	if ( ! $plugin->is_configured() ) {
		return new WP_Error( 'not_configured', 'Rentcast API key is not configured' );
	}

	// Create a mock REST request to use the existing valuation method
	$request = new WP_REST_Request( 'GET', '/frs-property-valuation/v1/valuation' );
	$request->set_param( 'address', $address );

	$response = $plugin->get_valuation( $request );

	if ( is_wp_error( $response ) ) {
		return $response;
	}

	// If it's a WP_REST_Response, extract the data
	if ( $response instanceof WP_REST_Response ) {
		$data = $response->get_data();

		// Transform Rentcast response to the format frs-lead-pages expects
		return [
			'success' => true,
			'data'    => [
				'address'        => $address,
				'price'          => $data['price'] ?? $data['priceEstimate'] ?? '',
				'priceHigh'      => $data['priceRangeHigh'] ?? '',
				'priceLow'       => $data['priceRangeLow'] ?? '',
				'beds'           => $data['bedrooms'] ?? '',
				'baths'          => $data['bathrooms'] ?? '',
				'sqft'           => $data['squareFootage'] ?? '',
				'yearBuilt'      => $data['yearBuilt'] ?? '',
				'propertyType'   => $data['propertyType'] ?? '',
				'lastSaleDate'   => $data['lastSaleDate'] ?? '',
				'lastSalePrice'  => $data['lastSalePrice'] ?? '',
				'raw'            => $data,
			],
		];
	}

	return $response;
}
