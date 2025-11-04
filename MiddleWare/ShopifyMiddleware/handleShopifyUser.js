/**
 * user resgitertion controller 
 * for registertaion use shopify signup page proxy
 * 
 */
const mongoose = require("mongoose");
const { shopModel } = require("../../Modal/shopify");

const getCustomerDetail = async (shop, customerId) => {
    try {

        const shopDoc = await shopModel.findOne({ shop: shop });
        if (!shopDoc || !shopDoc.accessToken) {
            console.error('Shop not found or access token missing for', shop);
            return null;
        }

        const gid = String(customerId).startsWith('gid://')
            ? String(customerId)
            : `gid://shopify/Customer/${customerId}`;

        const query = `
            query {
                customer(id: "${gid}") {
                    id
                    email
                    firstName
                    lastName
                    phone
                    createdAt
                    verifiedEmail
                }
            }
        `;

        const res = await axios.post(
            `https://${shop}/admin/api/2024-07/graphql.json`,
            { query },
            {
                headers: {
                    "X-Shopify-Access-Token": shopDoc.accessToken,
                    "Content-Type": "application/json",
                },
                validateStatus: () => true,
            }
        );

        if (res.status === 401) {
            console.error('GraphQL 401 Unauthorized for shop', shop);
            return null;
        }
        if (res.status >= 400) {
            console.error('GraphQL error status:', res.status, res.data);
            return null;
        }
        return res.data?.data?.customer || null;
    } catch (error) {
        console.error('Error fetching customer detail:', error.message);
        return null;
    }
}

const manageShopifyUser = async (shop, customerId) => {
    try {
        const customer = await getCustomerDetail(shop, customerId);
        console.log("customer", customer)
        // let enriched = null;
        // try {
        //     enriched = await getCustomerDetail(shop, customerId);
        // } catch { }

        // const finalFirstName = enriched?.firstName || firstName;
        // const finalLastName = enriched?.lastName || lastName;
        // const finalFullname = `${finalFirstName} ${finalLastName}`.trim() || fullname;
        // const finalEmail = (enriched?.email || email || '').toLowerCase();
        // const finalPhone = enriched?.phone || phone || undefined;
        // const randomPassword = crypto.randomBytes(16).toString('hex');
        // const hashedPassword = await bcrypt.hash(randomPassword, roundingNumber);
        // const newUser = new User({
        //     fullname: finalFullname,
        //     email: finalEmail,
        //     password: hashedPassword,
        //     phone: finalPhone,
        //     address: addressString || undefined,
        //     city: addr.city || undefined,
        //     state: addr.province || addr.state || undefined,
        //     zip: addr.zip || undefined,
        //     country: addr.country || undefined,
        //     role: 'user',
        //     isActive: true,
        //     userType: 'shopify_customer',
        //     walletBalance: 0,
        //     shopifyCustomerId: customer.id?.toString(),
        // });

        // await newUser.save();
        // console.log('Customer saved to database:', { id: newUser._id, email: newUser.email });
        return { success: true, };
    } catch (err) {

        if (err?.code === 11000) {
            console.log('Duplicate key on save, acknowledging webhook');
            return res.status(200).json({ success: true, message: 'User already exists' });
        }
        console.error("Webhook error:", err?.message || err);
        return res.sendStatus(200);
    }
}

module.exports = {
    manageShopifyUser
}
