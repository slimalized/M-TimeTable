const storage = ((key) => ({
    save(value) { localStorage.setItem(key, JSON.stringify(value)) },
    load() { return localStorage.getItem(key) && JSON.parse(localStorage.getItem(key)) },
}))("selected");

let selected = storage.load() || { year: undefined, module: "Spr-A" };

const create_element = HTML_tag => (props = {}) =>{
    const element = document.createElement(HTML_tag);

    if (props.innerText) element.innerText = props.innerText;
    if (props.class_list) props.class_list.forEach(c => element.classList.add(c));
    if (props.children_list) {
        const f = new DocumentFragment();
        props.children_list.forEach(c => f.appendChild(c));
        element.appendChild(f);
    };

    ["alt", "for", "href", "htmlFor", "id", "name", "src", "title", "type", "value"]
    .forEach(prop =>{
        if(props[prop]) element[prop] = props[prop];
    });

    return element;
};
const ce_a = create_element("a");
const ce_div = create_element("div");
const ce_img = create_element("img");
const ce_input = create_element("input");
const ce_label = create_element("label");
const ce_option = create_element("option");
const ce_p = create_element("p");
const ce_select = create_element("select");
const create_module_selector = () => {
    return ce_div({
        id: "module-selector",
        children_list: ["Spr-A", "Spr-B", "Spr-C", "Aut-A", "Aut-B", "Aut-C",]
            .map(module => ce_label({
                children_list: [
                    ce_input({
                        id: module,
                        name: "module",
                        type: "radio",
                        value: module
                    }),
                ],
                htmlFor: module,
                innerText: module.replace("Spr-", "春").replace("Aut-", "秋"),
            })),
    });
};
const create_year_selector = arr => {
    return ce_select({
        id: "year-selector",
        children_list :
            [...new Set(arr.map(c => c.year))]
            .sort((a, b) => b - a)
            .map(year => ce_option({
                innerText: year,
                value: year,
            })),
    });
};
const create_option_bar = arr => {
    return ce_div({
        id: "m-timetable-option-bar",
        children_list: [
            create_year_selector(arr),
            create_module_selector(),
        ],
    });
};

const create_timetable_label = (id_val, label_text_arr) => {
    return ce_div({
        id: id_val,
        children_list: label_text_arr.map(label_text =>
            ce_div({
                innerText: label_text,
            })
        ),
    });
};
const create_main = () => {
    return ce_div({
        id: "m-timetable-main",
        children_list: [
            create_timetable_label("time-label", ["1", "2", "3", "4", "5", "6"]),
            create_timetable_label("week-label", ["月", "火", "水", "木", "金"]),
            ce_div({id: "timetable"}),
        ],
    });
};
const create_timetable = arr =>{
    return ce_div({
        id: "m-timetable",
        children_list: [
            create_option_bar(arr),
            create_main(),
            ce_div({id: "m-timetable-sub"}),
        ],
    });
}

const remove_courses = ()=>{
    const timetable = document.getElementById("timetable");
    while(timetable.firstChild){
        timetable.removeChild(timetable.firstChild);
    };
    const sub = document.getElementById("m-timetable-sub");
    while(sub.firstChild){
        sub.removeChild(sub.firstChild);
    };
};

const create_notification_imgs_list = (icon_img_HTMLCollection, courceurl) => {
  const type_arr = ["news", "task", "result", "comment", "individual"],
    links = ["_news", "", "_grade", "_topics", "_coursecollection_user"];
    return [...icon_img_HTMLCollection].map((notification, i) =>
    ce_a({
      href: courceurl + links[i],
      children_list: [
        ce_img({
          class_list: Boolean(notification.title) ? ["has_notification"] : [],
          alt: type_arr[i],
          title: type_arr[i],
          src: chrome.runtime.getURL(`notice-icons/${type_arr[i]}.svg`),
        }),
      ],
    })
  );
};

const create_course_schedule = course => {
    return ce_p({
        class_list: ["schedule"],
        innerText: course.schedule || "---",
    });
}
const create_course_title = course => {
    return ce_p({
        class_list: ["title"],
        innerText: course.title,
    });
}
const create_course_notice = course => {
    return ce_div({
        class_list: ["notice"],
        children_list: create_notification_imgs_list(course.notice, course.url),
    });
}
const create_course = placable => course => {
    return ce_a({
        children_list: [
            ce_div({
                children_list:
                    (placable)
                    ? [
                        create_course_title(course),
                        create_course_notice(course),
                    ]
                    : [
                        create_course_schedule(course),
                        create_course_title(course),
                        create_course_notice(course),
                    ]
                ,
                class_list: ["course"],
            }),
        ],
        href: course.url,
    })
}
const create_placable_course = create_course(true);
const create_un_placable_course= create_course(false);

const get_selected_course_arr = (selected_year, selected_module , arr) => {
    const selected_year_course_arr = arr.filter(course => course.year == selected_year);
    return {
        "placable_arr" :
            selected_year_course_arr
            .filter(course => course.schedule[selected_module] != null)
        ,
        "un_placable_arr" :
            selected_year_course_arr
            .filter(course => typeof(course.schedule) == "string")
    }
};

const set_placable_courses = course_arr =>{
    const f = new DocumentFragment();
    let count = 30; // 5(days) * 6(classes)

    course_arr
    .map(course => course.schedule[selected.module]
    .map(sch => {
        count -= sch.time.length;
        const c = create_placable_course(course)
        const column_start = ["月", "火", "水", "木", "金"].indexOf(sch.day) + 1;
        c.style.gridColumn = `${column_start} / ${column_start + 1}`;
        c.style.gridRow = `${sch.time[0]} / ${sch.time.slice(-1)[0] + 1}`;
        return c;
    }))
    .flat()
    .forEach(c => f.appendChild(c));

    for(let i = 0; i < count; i++){
        f.appendChild(ce_div({class_list: ["course", "dummy"]}))
    }

    document.getElementById("timetable").appendChild(f);
}

const set_un_placable_courses = course_arr =>{
    const f = new DocumentFragment();
    course_arr
    .map(course => create_un_placable_course(course))
    .forEach(c => f.appendChild(c));
    document.getElementById("m-timetable-sub").appendChild(f);
}

const update_courses = course_arr =>{
    const selected_course_arr = get_selected_course_arr(selected.year, selected.module, course_arr);
    remove_courses();
    set_placable_courses(selected_course_arr.placable_arr);
    set_un_placable_courses(selected_course_arr.un_placable_arr);
}

const format_schedule = schedule_str => {
    const obj = {};
    schedule_str.split(/(?=春|秋)/).forEach(str =>{
        const season
            = (str.match(/[春秋]/) == "春") ? "Spr"
            : (str.match(/[春秋]/) == "秋") ? "Aut"
            : null;
        const term = str.match(/[ABC]/g);
        const date = str.match(/[月火水木金]([1-6],*)+/g);

        if(!season || !term || !date) return;

        term.forEach(t => {
            obj[`${season}-${t}`] = [];
            date.forEach(d => {
                obj[`${season}-${t}`].push(
                    {
                        "day" : d[0],
                        "time": d.match(/\d+/g).map(Number),
                    }
                );
            });
        });
    });
    return (Object.keys(obj).length)
        ? obj
        : schedule_str;
};

window.addEventListener("load", () => {

    const format = (document.getElementsByClassName("coursecard")[0])
        ? "card"
        : "list";
    const course_arr = [
        ...(document.getElementsByClassName(`course${format}-c`)),
        ...(document.getElementsByClassName(`course${format}-r`))
    ].map(course => {
        return (format == "list")
        ? {
            // format : list
            ["title"]: course.querySelector(`span.courselist-title > a`).title,
            ["url"]: course.querySelector(`span.courselist-title > a`).href,
            ["year"]: parseInt(course.children[1].innerText),
            ["schedule"]: format_schedule(course.children[2].innerText),
            ["notice"]: course.getElementsByClassName("course-card-status")[0].children,
        }
        : {
            // format : card
            ["title"]: course.querySelector(`div.course-card-title > a`).title,
            ["url"]: course.querySelector(`div.course-card-title > a`).href,
            ["year"]: parseInt(course.getElementsByClassName("courseitemdetail-date")[0].innerText),
            ["schedule"]: format_schedule(course.querySelector("dd.courseitemdetail > span").innerText),
            ["notice"]: course.getElementsByClassName("course-card-status")[0].children,
        }
    });

    document.getElementById("coursememo")
    .insertAdjacentElement("afterend", create_timetable(course_arr));

    if(selected.year == undefined || document.querySelector(`#year-selector > option[value="${selected.year}"]`) == null){
        selected.year = Number(document.getElementById("year-selector").value);
        storage.save(selected);
    }

    document.querySelector(`#year-selector > option[value="${selected.year}"]`).selected = true;
    document.querySelector(`#module-selector input[value="${selected.module}"]`).checked = true;

    update_courses(course_arr);

    const year_selector = document.getElementById("year-selector");
    year_selector.addEventListener("change", () => {
        selected.year = Number(year_selector.value);
        storage.save(selected);
        update_courses(course_arr);
    });

    document.querySelectorAll(`input[type="radio"][name="module"]`)
    .forEach(module_selector => {
        module_selector.addEventListener("change", () => {
            selected.module = module_selector.value;
            storage.save(selected);
            update_courses(course_arr);
        });
    })
});
