async function run() {
    try {
        const res = await fetch('http://localhost:5000/api/orders');
        const orders = await res.json();
        console.log('Total Orders:', orders.length);
        orders.forEach(o => {
            console.log(`Order ID: ${o._id}, User: "${o.userName}"`);
        });
    } catch (e) {
        console.error(e);
    }
}
run();
