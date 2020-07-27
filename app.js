const express = require("express");
const cors = require("cors");
const Timetable = require("comcigan-parser-edited");

const timetable = new Timetable();
const app = express();

app.use(cors());

app.get("/api/schools/:type/:schoolName", async (res, req, next) => {
  const type = res.params.type;
  const schoolName = res.params.schoolName;
  if (type || schoolName !== null || "") {
    let searchSchool = false;
    let school = "";
    let result_data;
    await timetable.init();
    await timetable.searchSchool(schoolName).then((result) => {
      if (result.searchSchool) {
        searchSchool = true;
        school = result.data;
      } else if (result.data.split(".")[0] === "검색된 학교가 많습니다") {
        const totalData = result.data.split(".")[2].replace(/[^0-9]/g, "");
        result_data = {
          reason: result.data,
          reasonShort: "검색된 학교가 많습니다",
          totalData,
        };
      } else if (result.data === "검색된 학교가 없습니다.") {
        result_data = {
          reason: result.data,
          reasonShort: "검색된 학교가 없습니다",
          totalData: 0,
        };
      }
    });

    if (type === "search") {
      await req
        .status(200)
        .send(
          searchSchool
            ? { searchSchool, school }
            : { searchSchool, result_data }
        )
        .end();
    } else if (type === "schedule") {
      if (searchSchool) {
        await timetable.init();
        await timetable.setSchool(school);
        await timetable.getTimetable().then((result) => {
          const firstClass = result[1];
          const firstCount = result[1].length;
          const secondClass = result[2];
          const secondCount = result[2].length;
          const thirdClass = result[3];
          const thirdCount = result[3].length;
          req.status(200).send({
            searchSchool,
            class: {
              first: firstClass,
              count: firstCount,
              second: secondClass,
              count: secondCount,
              third: thirdClass,
              count: thirdCount,
            },
          });
        });
      } else {
        await req.status(200).send({ searchSchool, result_data }).end();
      }
    } else {
      const error = new Error("잘못된 접근입니다");
      error.status = 404;
      next(error);
    }
  }
});

app.get("/", (res, req, next) => {
  req.status(200).end();
});

app.use((res, req, next) => {
  const error = new Error("잘못된 접근입니다");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

app.listen(process.env.PORT || 3000, (err) => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${process.env.PORT || 3000}`);
});
