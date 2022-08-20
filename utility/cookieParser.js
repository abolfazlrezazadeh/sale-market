function parseCookies(request) {
    const list = {};
    const cookieHeader = request.get('Cookie');
    if (!cookieHeader) return list;
    cookieHeader.split(";").forEach(cookie => {
        // name = loggedIn      //rest= true
        let [name, ...rest] = cookie.split('=');
        name.trim(); // delete additional spaces
        if (!name) return;
        // value = true
        const value = rest.join('=').trim();
        if (!value) return;
        // change type of true(String) to Object
        list[name]=decodeURIComponent(value); // if its encrypted 'decodeURIComponent' decode it
    });
    return list;
};


module.exports = parseCookies;