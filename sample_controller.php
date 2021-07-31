<?php
/**
 * Restrict direct access
 */
if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Dashboard Controller Class
 */
class Dashboard extends CI_Controller
{
	/**
	 * Class Construtor
	 */
	public function __construct()
	{
		/**
		 * Invoke the Parent Contructor Method
		 */
    	parent::__construct();

    	/**
    	 * Load the User Dashboard Library
    	 */
		$this->load->library('userdashboard');

		/**
		 * Check whether the user accessing the dashboard
		 * is logged in or not
		 */
    	check_user_login();

    	/**
    	 * Check whether the logged in user accessing the
    	 * dashboard is a Tenant or not
    	 */
    	check_tenant();
    }

    /**
     * Dashboard landing page method
     * 
     * @return Void
     */
	public function index()
	{
		/**
		 * Direct user directly to enterprise dashboard
		 */
		$this->enterprise();
	}

	/**
	 * Display enterprise dashboard (showing list of regions in enterprise)
	 * 
	 * @param  Int    $tenant_code
	 * 
	 * @return Void
	 */
	public function enterprise(Int $tenant_code): void
    {
    	/**
    	 * Initialize the Array
    	 */
    	$data = array();

    	/**
    	 * Initialize the variables
    	 */
		$user_id     = $this->session->userdata('user_id');
		$ts_app_url  = $this->config->item('ts_app_url');
		$tenant_code = $this->session->userdata('account_id');
		$rand        = substr(str_shuffle("abcdefghijklmnopqrstuvwxyz123456789"), -16);
		$is_user_super_admin  = $this->User_Model->is_user_super_admin($user_id);
		$is_user_tenant_admin = $this->User_Model->is_user_tenant_admin(null, $user_id);

		/**
		 * Populate the $data Array
		 */
		$data['status_data']    = $this->Region_Model->get_user_regions();
		$data['timezone']       =  $this->Company_Model->get_company_timezone();
		$data['product_level']  = get_app_product_type();
		$data['dashboard_type'] = 'enterprise';
		$data['section_title']  = 'Dashboard';
		$data['content_main']   = 'dashboard';
		$data['user_id']        = $user_id;
		$data['ts_app_url']     = $ts_app_url;
		$data['tenant_code']    = $tenant_code;
		$data['random_str']     = $rand;

		/**
		 * Set the flags for the View file
		 */
		$data['is_user_super_admin']  = $is_user_super_admin;
		$data['is_user_tenant_admin'] = $is_user_tenant_admin;

		/**
		 * Include the required JS files
		 */
		$data['required_js'] = array(
			'vendor/jquery.knob.js',
			'includes/dashboard/status-panels.js',
			'includes/dashboard/enterprise-status.js',
			'includes/dashboard/kpi-panels.js',
			'includes/dashboard/kpi-enterprise.js'
		);
		
		/**
		 * Pass the data to the view file
		 */
		$this->userdashboard->load_dashboard($data);
	}
}
