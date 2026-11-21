/**
 * PayPal REST API Helper (Subscriptions v1 + Orders v2 fallback)
 * Soporta tarjetas de crédito/débito internacionales y saldo PayPal en USD ($2.00 USD / mes).
 */

let cachedPaypalToken = null;
let cachedPaypalTokenExpiry = 0;
let cachedPlanIds = {}; // { '2.00': 'P-...', '0.99': 'P-...' }

export function getPaypalBaseUrl() {
    const mode = (process.env.PAYPAL_MODE || 'live').toLowerCase().trim();
    if (mode === 'sandbox' || mode === 'test') {
        return 'https://api-m.sandbox.paypal.com';
    }
    return 'https://api-m.paypal.com';
}

export async function getPaypalAccessToken() {
    const now = Date.now();
    if (cachedPaypalToken && now < cachedPaypalTokenExpiry) {
        return { token: cachedPaypalToken, baseUrl: getPaypalBaseUrl() };
    }

    const clientId = (process.env.PAYPAL_CLIENT_ID || '').trim();
    const clientSecret = (process.env.PAYPAL_CLIENT_SECRET || '').trim();

    if (!clientId || !clientSecret) {
        throw new Error('Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET en las variables de entorno');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const urlsToTry = [getPaypalBaseUrl()];
    // Si está en 'live' pero el usuario puso credenciales Sandbox de prueba (o viceversa), probar ambos automáticamente
    const fallbackUrl = urlsToTry[0].includes('sandbox')
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
    urlsToTry.push(fallbackUrl);

    let lastErr = null;
    for (const baseUrl of urlsToTry) {
        try {
            const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });

            if (res.ok) {
                const data = await res.json();
                cachedPaypalToken = data.access_token;
                cachedPaypalTokenExpiry = now + ((data.expires_in || 3600) - 60) * 1000;
                return { token: cachedPaypalToken, baseUrl };
            } else {
                lastErr = await res.text();
            }
        } catch (err) {
            lastErr = err.message;
        }
    }

    throw new Error(`Error autenticando con PayPal: ${lastErr}`);
}

/**
 * Obtiene o crea automáticamente un Plan de Suscripción Mensual en PayPal ($2.00 USD / mes)
 */
async function getOrCreatePaypalBillingPlan(token, baseUrl, usdAmount, planName) {
    const amountKey = Number(usdAmount).toFixed(2);
    if (process.env.PAYPAL_PLAN_ID && amountKey === '2.00') {
        return process.env.PAYPAL_PLAN_ID.trim();
    }
    if (cachedPlanIds[amountKey]) {
        return cachedPlanIds[amountKey];
    }

    // 1. Crear Producto en Catálogo de PayPal
    const prodRes = await fetch(`${baseUrl}/v1/catalogs/products`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `hys-prod-${amountKey}`
        },
        body: JSON.stringify({
            name: 'Asistente de Higiene y Seguridad PRO',
            description: 'Suscripción mensual a la plataforma Asistente H&S',
            type: 'SERVICE',
            category: 'SOFTWARE'
        })
    });

    if (!prodRes.ok) {
        throw new Error(`No se pudo crear producto en PayPal: ${await prodRes.text()}`);
    }
    const prodData = await prodRes.json();

    // 2. Crear Plan Mensual en USD
    const planRes = await fetch(`${baseUrl}/v1/billing/plans`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `hys-plan-${amountKey}`
        },
        body: JSON.stringify({
            product_id: prodData.id,
            name: planName,
            description: `Suscripción mensual con débito automático (${amountKey} USD / mes)`,
            status: 'ACTIVE',
            billing_cycles: [
                {
                    frequency: {
                        interval_unit: 'MONTH',
                        interval_count: 1
                    },
                    tenure_type: 'REGULAR',
                    sequence: 1,
                    total_cycles: 0, // 0 = ilimitado hasta que el usuario cancele
                    pricing_scheme: {
                        fixed_price: {
                            value: amountKey,
                            currency_code: 'USD'
                        }
                    }
                }
            ],
            payment_preferences: {
                auto_bill_outstanding: true,
                setup_fee_failure_action: 'CONTINUE',
                payment_failure_threshold: 3
            }
        })
    });

    if (!planRes.ok) {
        throw new Error(`No se pudo crear plan en PayPal: ${await planRes.text()}`);
    }
    const planData = await planRes.json();
    cachedPlanIds[amountKey] = planData.id;
    return planData.id;
}

/**
 * Crea una Suscripción de Débito Automático Mensual en PayPal (con fallback automático a Order v2 con Tarjeta)
 */
export async function createPaypalCheckout({ userId, email, usdAmount, planName, baseUrl: appBaseUrl, billingMode = 'recurring' }) {
    const { token, baseUrl } = await getPaypalAccessToken();
    const amountStr = Number(usdAmount).toFixed(2);

    // 1. Intentar Suscripción Mensual de Débito Automático (PayPal Subscriptions v1)
    if (billingMode !== 'single') {
        try {
            const planId = await getOrCreatePaypalBillingPlan(token, baseUrl, usdAmount, planName);
            const subRes = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    plan_id: planId,
                    custom_id: userId,
                    subscriber: email ? { email_address: email } : undefined,
                    application_context: {
                        brand_name: 'Asistente H&S',
                        locale: 'es-AR',
                        shipping_preference: 'NO_SHIPPING',
                        user_action: 'SUBSCRIBE_NOW',
                        payment_method: {
                            payer_selected: 'PAYPAL',
                            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
                        },
                        return_url: `${appBaseUrl}/subscribe?status=approved&provider=paypal`,
                        cancel_url: `${appBaseUrl}/subscribe?status=cancelled`
                    }
                })
            });

            if (subRes.ok) {
                const subData = await subRes.json();
                const approveLink = (subData.links || []).find(l => l.rel === 'approve');
                if (approveLink?.href) {
                    return { url: approveLink.href, id: subData.id, type: 'subscription' };
                }
            } else {
                console.warn('[PayPal] Subscriptions API fallback to Orders v2:', await subRes.text());
            }
        } catch (subErr) {
            console.warn('[PayPal] Fallback a Orders v2:', subErr.message);
        }
    }

    // 2. Fallback o pago de 1 mes con Tarjeta de Débito/Crédito vía PayPal Orders v2
    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    custom_id: userId,
                    description: planName,
                    amount: {
                        currency_code: 'USD',
                        value: amountStr
                    }
                }
            ],
            application_context: {
                brand_name: 'Asistente H&S',
                locale: 'es-AR',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
                return_url: `${appBaseUrl}/subscribe?status=approved&provider=paypal`,
                cancel_url: `${appBaseUrl}/subscribe?status=cancelled`
            }
        })
    });

    if (!orderRes.ok) {
        throw new Error(`Error creando orden de PayPal: ${await orderRes.text()}`);
    }

    const orderData = await orderRes.json();
    const approveLink = (orderData.links || []).find(l => l.rel === 'approve' || l.rel === 'payer-action');
    if (!approveLink?.href) {
        throw new Error('PayPal no devolvió un enlace de aprobación válido.');
    }

    return { url: approveLink.href, id: orderData.id, type: 'order' };
}

/**
 * Verifica una suscripción o captura una orden de PayPal al regresar el usuario
 */
export async function verifyPaypalPayment({ subscriptionId, orderId }) {
    const { token, baseUrl } = await getPaypalAccessToken();

    if (subscriptionId) {
        const res = await fetch(`${baseUrl}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            throw new Error(`No se pudo verificar la suscripción de PayPal (${res.status})`);
        }
        const data = await res.json();
        const isApproved = data.status === 'ACTIVE' || data.status === 'APPROVED';
        return {
            approved: isApproved,
            autoRenew: true,
            customId: data.custom_id || null,
            payerEmail: (data.subscriber?.email_address || '').toLowerCase().trim(),
            referenceId: data.id
        };
    }

    if (orderId) {
        // Primero intentar capturar el pago si está en estado APPROVED
        let orderData = null;
        const capRes = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (capRes.ok) {
            orderData = await capRes.json();
        } else {
            // Si ya estaba capturada, consultar estado
            const getRes = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (getRes.ok) {
                orderData = await getRes.json();
            }
        }

        if (!orderData) {
            throw new Error('No se pudo verificar la orden de PayPal');
        }

        const isCompleted = orderData.status === 'COMPLETED' || orderData.status === 'APPROVED';
        const pu = (orderData.purchase_units || [])[0] || {};
        const customId = pu.custom_id || pu.payments?.captures?.[0]?.custom_id || null;
        const payerEmail = (orderData.payer?.email_address || '').toLowerCase().trim();

        return {
            approved: isCompleted,
            autoRenew: false,
            customId,
            payerEmail,
            referenceId: orderData.id
        };
    }

    return { approved: false };
}

/**
 * Cancela una suscripción activa de PayPal
 */
export async function cancelPaypalSubscription(subscriptionId) {
    if (!subscriptionId) return;
    const { token, baseUrl } = await getPaypalAccessToken();
    await fetch(`${baseUrl}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Cancelado por el usuario desde Asistente H&S' })
    });
}
