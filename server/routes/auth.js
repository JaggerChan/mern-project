const router = require("express").Router();
const registerValidation = require("../validation").registerValidation;
const loginValidation = require("../validation").loginValidation;
const User = require("../models").user;
const jwt = require("jsonwebtoken");

router.use((req, res, next) => {
  console.log("正在接受一个跟auth有关的请求");
  next();
});

router.get("/testAPI", (req, res) => {
  return res.send("成功连接auth route");
});

router.post("/register", async (req, res) => {
  //确认数据是否符合规范
  let { error } = registerValidation(req.body);

  if (error) return res.status(400).send(error.details[0].message);

  //确认信箱是否被注册过
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("此信箱已经被注册过了");
  //注册新用户
  let { email, username, password, role } = req.body;
  let newUser = new User({ email, username, password, role });
  try {
    let savedUser = await newUser.save();
    return res.send({ msg: "使用者成功储存", savedUser });
  } catch (e) {
    return res.status(500).send("无法储存使用者");
  }
});

router.post("/login", async (req, res) => {
  //确认数据是否符合规范
  let { error } = loginValidation(req.body);

  if (error) return res.status(400).send(error.details[0].message);

  //确认信箱是否被注册过
  const foundUser = await User.findOne({ email: req.body.email });
  if (!foundUser)
    return res.status(401).send("无法找到使用者，请确认信箱是否正确");

  foundUser.comparePassword(req.body.password, (err, isMatch) => {
    if (err) return res.status(500).send(err);
    if (isMatch) {
      //制作jsonwebtoken
      const tokenObject = { _id: foundUser._id, email: foundUser.email };
      const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
      return res.send({
        message: "成功登入",
        token: "JWT " + token,
        user: foundUser,
      });
    } else {
      return res.status(401).send("密码错误");
    }
  });
});

module.exports = router;
