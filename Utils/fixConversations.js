public function saveStudentData(Request $request) {
    \Log:: info('saveStudentData called:', [
        'request_data' => $request -> all(),
        'session_data' => session() -> all(),
        'headers' => $request -> headers -> all()
    ]);

    // Prevent duplicate submissions
    $email = $request -> input('email');
    $courseId = $request -> input('select_course');
    $cacheKey = "student_submission_{$email}_{$courseId}";

    if (Cache:: has($cacheKey)) {
        return response() -> json([
            'status' => 'error',
            'message' => 'Student submission already in progress. Please wait...',
            'error_type' => 'duplicate_submission'
        ], 400);
    }

    // Set cache for 30 seconds to prevent duplicates
    Cache:: put($cacheKey, true, 30);

    // Get shop_id first before creating Shopify object
    $shopId = $this -> getShopId($request);

    if (!$shopId) {
        // Clear cache on error
        Cache:: forget($cacheKey);

        \Log:: error('Shop ID not found in saveStudentData', [
            'request_data' => $request -> all(),
            'session_data' => session() -> all(),
            'headers' => $request -> headers -> all()
        ]);

        return response() -> json([
            'status' => 'error',
            'message' => 'Shop ID not found. Please ensure you are properly authenticated.',
        ], 400);
    }

    // Ensure session is set for CreateShopifyObject
    if (!session('shop_id')) {
        session(['shop_id' => $shopId]);
    }

    $shopify = CreateShopifyObject($shopId); // Pass shopId to helper

    $validator = Validator:: make($request -> all(), [
        'first_name' => 'required|string|max:255',
        'last_name' => 'required|string|max:255',
        'email' => 'required|email',
        'order_id' => 'nullable|integer',
        'order_no' => 'nullable|integer',
        'select_course' => 'required|integer',
        'course_expired_date' => 'nullable|string',
        'status' => 'nullable|string'
    ]);

    if ($validator -> fails()) {
        // Clear cache on validation error
        Cache:: forget($cacheKey);

        return response() -> json([
            'status' => 'error',
            'errors' => $validator -> errors()
        ], 422);
    }

    $email = $request -> input('email');
    $first_name = $request -> input('first_name');
    $last_name = $request -> input('last_name');
    $course_id = $request -> input('select_course');
    $order_id = $request -> input('order_id');
    $order_no = $request -> input('order_no');
    $course_expired_date = $request -> input('course_expired_date');
    $status = $request -> input('status');

    // Check course visibility first
    \Log:: info('Looking for course:', [
        'course_id' => $course_id,
        'shop_id' => $shopId,
        'course_id_type' => gettype($course_id)
    ]);

    $course = Course:: where('shop_id', $shopId) -> where('id', $course_id) -> first();

    if (!$course) {
        // Clear cache on error
        Cache:: forget($cacheKey);

        \Log:: error('Course not found in saveStudentData:', [
            'course_id' => $course_id,
            'shop_id' => $shopId,
            'session_shop_id' => session('shop_id'),
            'available_courses' => Course:: where('shop_id', $shopId) -> pluck('id', 'title') -> toArray(),
            'course_id_in_available' => in_array($course_id, Course:: where('shop_id', $shopId) -> pluck('id') -> toArray())
        ]);

        return response() -> json([
            'status' => 'error',
            'message' => 'Course not found.'
        ], 404);
    }

    \Log:: info('Course found:', [
        'course_id' => $course -> id,
        'course_title' => $course -> title,
        'course_visibility' => $course -> visibility
    ]);



    // Create customer in Shopify first
    $query = '
        mutation {
        customerCreate(input: {
            email: "' . $email . '"
                firstName: "' . $first_name . '"
                lastName: "' . $last_name . '"
        }) {
                customer {
                id
                firstName
                lastName
                email
            }
                userErrors {
                field
                message
            }
        }
    } ';

    try {
        $response = $shopify -> GraphQL -> post($query);

        // Check for GraphQL errors
        if (isset($response['errors'])) {
            $errorMessage = 'Unable to connect to Shopify. Please check your internet connection and try again.';



            // Clear cache on error
            Cache:: forget($cacheKey);

            return response() -> json([
                'status' => 'error',
                'message' => $errorMessage,
                'error_type' => 'shopify_api_error',
                'details' => $response['errors']
            ], 400);
        }

        // Check for user errors in customerCreate
        if (isset($response['data']['customerCreate']['userErrors']) && !empty($response['data']['customerCreate']['userErrors'])) {
            $userErrors = $response['data']['customerCreate']['userErrors'];

            // Convert technical errors to user-friendly messages
            $errorMessage = 'Unable to create student account. ';
            foreach($userErrors as $error) {
                if (strpos($error['message'], 'Email') !== false && strpos($error['message'], 'taken') !== false) {
                    $errorMessage = 'This email address is already registered. Please use a different email or contact support.';
                    break;
                } elseif(strpos($error['message'], 'Email') !== false && strpos($error['message'], 'invalid') !== false) {
                    $errorMessage = 'Please enter a valid email address.';
                    break;
                } elseif(strpos($error['message'], 'firstName') !== false || strpos($error['message'], 'lastName') !== false) {
                    $errorMessage = 'Please enter valid first and last names.';
                    break;
                }
            }



            // Clear cache on error
            Cache:: forget($cacheKey);

            return response() -> json([
                'status' => 'error',
                'message' => $errorMessage,
                'error_type' => 'customer_creation_error',
                'details' => $userErrors
            ], 400);
        }

        // Check if customer was created successfully
        if (!isset($response['data']['customerCreate']['customer'])) {


            // Clear cache on error
            Cache:: forget($cacheKey);

            return response() -> json([
                'status' => 'error',
                'message' => 'Unable to create student account. Please try again or contact support if the problem persists.',
                'error_type' => 'customer_creation_failed',
                'details' => $response
            ], 400);
        }

    } catch (\Exception $e) {
        Log:: error('Exception in customer creation', [
            'error' => $e -> getMessage(),
            'trace' => $e -> getTraceAsString(),
            'query' => $query
        ]);

        // Clear cache on error
        Cache:: forget($cacheKey);

        return response() -> json([
            'status' => 'error',
            'message' => 'Something went wrong while creating the student account. Please try again or contact support.',
            'error_type' => 'exception',
            'details' => $e -> getMessage()
        ], 500);
    }

    $customerGraphQL = $response['data']['customerCreate']['customer'];
    $shopifyCustomerId = str_replace("gid://shopify/Customer/", "", $customerGraphQL['id']);

    \Log:: alert("Shopify customer created with ID: ".$shopifyCustomerId);

    // Handle based on course visibility
    if ($course -> visibility == 'paid_private') {
        \Log:: alert("Processing paid course - creating draft order");

        $order_detail = self:: OrderCreateForCourse($course_id, $shopifyCustomerId, $shopId);

        \Log:: alert("Draft order created, invoice URL: ". ($order_detail ?? 'null'));

        if (!empty($order_detail) && $order_detail !== null) {
            // Clear cache on success
            Cache:: forget($cacheKey);

            return response() -> json([
                'status' => 'success',
                'message' => 'Customer created successfully. Redirecting to payment...',
                'redirect_url' => $order_detail,
                'course_type' => 'paid'
            ], 200);
        } else {
            \Log:: error('Failed to create draft order - order_detail is null or empty');
            // Clear cache on error
            Cache:: forget($cacheKey);

            return response() -> json([
                'status' => 'error',
                'message' => 'Failed to create payment link. Please try again.'
            ], 400);
        }

    } else {
        // Free course - save to database
        \Log:: alert("Processing free course - saving to database");

        try {
            $data = new Customer();
            $data -> customer_id = $shopifyCustomerId;
            $data -> shop_id = $shopId;
            $data -> customer_name = $first_name. ' '.$last_name;
            $data -> email = $email;
            $data -> order_id = $order_id;
            $data -> order_no = $order_no;
            $data -> course_id = json_encode([(string) $course_id]);
            $data -> course_expired_date = $course_expired_date;
            $data -> status = $status;

            $data -> save();

            \Log:: alert("Customer saved to database successfully");

            // Clear cache on success
            Cache:: forget($cacheKey);

            return response() -> json([
                'status' => 'success',
                'message' => 'Customer enrolled successfully in free course!',
                'data' => $customerGraphQL,
                'course_type' => 'free'
            ], 200);

        } catch (\Exception $e) {
            \Log:: alert("Error saving customer to database: ".$e -> getMessage());

            // Clear cache on error
            Cache:: forget($cacheKey);

            return response() -> json([
                'status' => 'error',
                'message' => 'Student account was created but there was an issue saving the enrollment. Please contact support for assistance.'
            ], 400);
        }
    }
}






// Customer get by customer id




try {
    $shop = Shops:: where('id', $shopId) -> where('is_active', 1) -> first();
    if (!$shop || !$shop -> permanent_token) {
        Log:: error('Shop not found or no access token for GraphQL customer fetch');
        return null;
    }

    $query = '
        query getCustomer($id: ID!) {
        customer(id: $id) {
            id
            firstName
            lastName
            email
            displayName
        }
    }
    ';

    $variables = [
        'id' => 'gid://shopify/Customer/'.$customerId
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://'.$shop -> shop_name. '.myshopify.com/admin/api/2024-07/graphql.json');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-Shopify-Access-Token: '.$shop -> permanent_token,
        'Content-Type: application/json',
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'query' => $query,
        'variables' => $variables
    ]));

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $data = json_decode($response, true);

        if (isset($data['data']['customer']) && $data['data']['customer']) {
            $customer = $data['data']['customer'];

            // Format the response to match our expected structure
            return [
                'customer_name' => trim(($customer['firstName'] ?? ''). ' '. ($customer['lastName'] ?? '')) ?: ($customer['displayName'] ?? 'Unknown Customer'),
                'email' => $customer['email'] ?? 'unknown@example.com'
            ];
        }
    }

    Log:: error('GraphQL customer fetch failed', [
        'customerId' => $customerId,
        'shopId' => $shopId,
        'httpCode' => $httpCode,
        'response' => $response
    ]);

    return null;
} catch (\Exception $e) {
    Log:: error('Error fetching customer via GraphQL: '.$e -> getMessage());
    return null;
}
}
