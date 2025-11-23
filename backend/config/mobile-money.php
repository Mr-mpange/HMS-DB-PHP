<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Mobile Money Configuration
    |--------------------------------------------------------------------------
    |
    | Configure your mobile money provider API credentials here.
    | Get credentials from respective providers:
    | - M-Pesa: https://developer.mpesa.vm.co.tz/
    | - Airtel Money: https://developers.airtel.africa/
    | - Tigo Pesa: Contact Tigo Tanzania
    | - Halopesa: Contact Halotel Tanzania
    |
    */

    'mpesa' => [
        'enabled' => env('MPESA_ENABLED', false),
        'api_key' => env('MPESA_API_KEY', ''),
        'public_key' => env('MPESA_PUBLIC_KEY', ''),
        'service_provider_code' => env('MPESA_SERVICE_PROVIDER_CODE', ''),
        'api_url' => env('MPESA_API_URL', 'https://openapi.m-pesa.com/sandbox'),
        'timeout' => 30,
    ],

    'airtel' => [
        'enabled' => env('AIRTEL_ENABLED', false),
        'client_id' => env('AIRTEL_CLIENT_ID', ''),
        'client_secret' => env('AIRTEL_CLIENT_SECRET', ''),
        'api_url' => env('AIRTEL_API_URL', 'https://openapiuat.airtel.africa'),
        'timeout' => 30,
    ],

    'tigo' => [
        'enabled' => env('TIGO_ENABLED', false),
        'username' => env('TIGO_USERNAME', ''),
        'password' => env('TIGO_PASSWORD', ''),
        'biller_code' => env('TIGO_BILLER_CODE', ''),
        'api_url' => env('TIGO_API_URL', ''),
        'timeout' => 30,
    ],

    'halopesa' => [
        'enabled' => env('HALOPESA_ENABLED', false),
        'api_key' => env('HALOPESA_API_KEY', ''),
        'merchant_code' => env('HALOPESA_MERCHANT_CODE', ''),
        'api_url' => env('HALOPESA_API_URL', ''),
        'timeout' => 30,
    ],

    'zenopay' => [
        'enabled' => env('ZENOPAY_API_KEY') ? true : false,
        'api_key' => env('ZENOPAY_API_KEY', ''),
        'merchant_id' => env('ZENOPAY_MERCHANT_ID', ''),
        'api_url' => env('ZENOPAY_API_URL', 'https://api.zenopay.com'),
        'env' => env('ZENOPAY_ENV', 'production'),
        'callback_url' => env('ZENOPAY_CALLBACK_URL', env('APP_URL') . '/api/payments/zenopay/callback'),
        'return_url' => env('ZENOPAY_RETURN_URL', env('APP_URL') . '/billing/payment-success'),
        'webhook_secret' => env('ZENOPAY_WEBHOOK_SECRET', ''),
        'timeout' => 30,
    ],

    // Callback URL for payment notifications
    'callback_url' => env('MOBILE_MONEY_CALLBACK_URL', env('APP_URL') . '/api/mobile-money/callback'),

    // Default currency
    'currency' => 'TZS',
];
