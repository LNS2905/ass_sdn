const authMiddleware = {
    isAuthenticated: (req, res, next) => {
        if (req.session.member) {
            if (req.session.member.isAdmin === true) {
                return res.redirect("/members")
            } else {
                return res.redirect("/")
            }
        }
        next();
    },

    ensureAuthenticated: (req, res, next) => {
        if (req.session.member) {
            next();
        } else {
            res.redirect("/members/login");
        }
    },

    isAdmin: (req, res, next) => {
        if (req.session.member && req.session.member.isAdmin) {
            return next();
        }
        res.status(403).send("You don't have permission in this page");
    }
}

module.exports = authMiddleware;