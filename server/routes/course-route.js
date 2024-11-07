const router = require("express").Router();
const Course = require("../models").course;
const courseValidation = require("../validation").courseValidation;

router.use((req, res, next) => {
  console.log("course route正在接受一个request..");
  next();
});

//获得系统中的所有课程
router.get("/", async (req, res) => {
  try {
    let courseFound = await Course.find({})
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

//用讲师ID寻找课程
router.get("/instructor/:_instructor_id", async (req, res) => {
  let { _instructor_id } = req.params;
  let coursesFound = await Course.find({ instructor: _instructor_id })
    .populate("instructor", ["username", "email"])
    .exec();
  return res.send(coursesFound);
});

//用学生ID来寻找注册过的课程
router.get("/student/:_student_id", async (req, res) => {
  let { _student_id } = req.params;
  let coursesFound = await Course.find({ students: _student_id })
    .populate("instructor", ["username", "email"])
    .exec();
  return res.send(coursesFound);
});

//用课程名称寻找课程
router.get("/findByName/:name", async (req, res) => {
  let { name } = req.params;
  try {
    let courseFound = await Course.find({ title: name })
      .populate("instructor", ["email", "username"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

//用课程ID寻找课程
router.get("/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let courseFound = await Course.findOne({ _id })
      .populate("instructor", ["email"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

//新增课程
router.post("/", async (req, res) => {
  //验证数据符合规范
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  if (req.user.isStudent()) {
    return res
      .status(400)
      .send("只有讲师才能发布新课程。如果你是讲师，请用讲师账号登录");
  }

  let { title, description, price } = req.body;
  try {
    let newCourse = new Course({
      title,
      description,
      price,
      instructor: req.user._id,
    });
    let savedCourse = await newCourse.save();
    return res.send("新课程已经保存");
  } catch (e) {
    return res.status(500).send("无法创建新课程。。");
  }
});

//让学生透过id来注册新课程
router.post("/enroll/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let course = await Course.findOne({ _id }).exec();
    course.students.push(req.user._id);
    await course.save();
    return res.send("注册完成");
  } catch (e) {
    return res.send(e);
  }
});

//更改课程
router.patch("/:_id", async (req, res) => {
  //验证数据符合规范
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let { _id } = req.params;
  //确认课程是否存在
  try {
    let courseFound = await Course.findOne({ _id });
    console.log(courseFound);
    if (!courseFound) {
      return res.status(400).send("找不到课程，无法更新课程内容");
    }

    //使用者必须是此课程讲师，才能编辑课程
    if (courseFound.instructor.equals(req.user._id)) {
      let updatedCourse = await Course.findOneAndUpdate({ _id }, req.body, {
        new: true,
        runValidators: true,
      });
      return res.send({ message: "课程已经更新成功", updatedCourse });
    } else {
      return res.status(403).send("只有此课程的讲师才能编辑课程");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

router.delete("/:_id", async (req, res) => {
  let { _id } = req.params;
  //确认课程是否存在
  try {
    let courseFound = await Course.findOne({ _id });
    console.log(courseFound);
    if (!courseFound) {
      return res.status(400).send("找不到课程，无法删除课程内容");
    }
    //使用者必须是此课程讲师，才能删除课程
    if (courseFound.instructor.equals(req.user._id)) {
      await Course.deleteOne({ _id }).exec();
      return res.send("课程已被删除");
    } else {
      return res.status(403).send("只有此课程的讲师才能删除课程");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

module.exports = router;
