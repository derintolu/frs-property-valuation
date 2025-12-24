<?php
if ( ! defined( 'ABSPATH' ) ) exit;

$api_key = get_option( 'frs_pv_rentcast_api_key', '' );
$is_configured = frs_property_valuation()->is_configured();
?>
<div class="wrap">
	<h1><?php _e( 'Property Valuation', 'frs-property-valuation' ); ?></h1>

	<form method="post" action="options.php">
		<?php settings_fields( 'frs_pv_settings' ); ?>

		<table class="form-table">
			<tr>
				<th scope="row">
					<label for="frs_pv_rentcast_api_key"><?php _e( 'Rentcast API Key', 'frs-property-valuation' ); ?></label>
				</th>
				<td>
					<input type="text" name="frs_pv_rentcast_api_key" id="frs_pv_rentcast_api_key"
						value="<?php echo esc_attr( $api_key ); ?>" class="regular-text" />
					<?php if ( $is_configured ) : ?>
						<span class="dashicons dashicons-yes-alt" style="color: #1e7e34; margin-left: 8px;"></span>
					<?php endif; ?>
				</td>
			</tr>
		</table>

		<?php submit_button(); ?>
	</form>

	<h2><?php _e( 'Shortcode', 'frs-property-valuation' ); ?></h2>
	<code>[frs_property_valuation]</code>
</div>
