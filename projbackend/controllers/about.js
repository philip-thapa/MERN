exports.aboutUs = (req, res) => {
  return res.json({
    miniProject: "PhilBah",
    TeamMembers: {
      member1: {
        name: "Philip Thapa",
        rollNo: "17U61A0528",
        email: "philipthapa3@gmail.com",
        phone: "8106267754",
        sex: "Male",
        college: "G.I.E.T",
      },
      member2: {
        name: "Mohd Isbah",
        rollNo: "17U61A0520",
        email: "mohammadisbah78@gmail.com",
        phone: "9959011207",
        sex: "Male",
        college: "G.I.E.T",
      },
    },
    Language: "Javascript",
    details:
      "we are making a full stack Ecommerce App. We are using Express(Nodejs) in the backend and React with Hooks in the Frontend. We are using BrainTree for payment gateway ",
  });
};
