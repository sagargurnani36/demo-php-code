<section class="container-fluid no-gutter reports">
	<div class="title">
		<h2>
            Reports
            <sub><a style="font: smaller;" href="<?php echo site_url('dashboard/region/' . $region_code . '/site/' . $site_id . '/reports-interactive'); ?>" rel="allergens">Interactive Reports</a></sub>
        </h2>
	</div>
	
	<?php $this->load->view('reports/tabs'); ?>
	
	<div class="container-fluid">
		<div class="row">
			<div class="col-xs-12">
				<?php
				$this->load->view('reports/tab-audit');
				$this->load->view('reports/tab-detailed-report');

				// TODO: Allow if licensed
				if ($product_type === 'prime') {
					$this->load->view('reports/tab-graph');
				}
				$this->load->view('reports/options');
				?>
			</div>
		</div>
	</div>
</section>
