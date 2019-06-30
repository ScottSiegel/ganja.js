// rust Template for the preamble
var preamble = (basis, classname) =>
`// 3D Projective Geometric Algebra
// Written by a generator written by enki.
#![allow(unused_imports)]
#![allow(dead_code)]
#![allow(non_upper_case_globals)]
#![allow(non_snake_case)]
#![allow(non_camel_case_types)]
#![feature(const_slice_len)]

use std::fmt;
use std::ops::{Index,IndexMut,Add,Sub,Mul,BitAnd,BitOr,BitXor,Not};

type float_t = f64;

// use std::f64::consts::PI;
const PI: float_t = 3.14159265358979323846;

const basis: &'static [&'static str] = &[ ${basis.map(x=>'"'+x+'"').join(',')} ];
const basis_count: usize = basis.len();

#[derive(Default,Debug,Clone,Copy,PartialEq)]
struct ${classname} {
    mvec: [float_t; basis_count]
}

impl ${classname} {
    pub const fn zero() -> Self {
        Self {
            mvec: [0.0; basis_count]
        }
    }

    pub const fn new(f: float_t, idx: usize) -> Self {
        let mut ret = Self::zero();
        ret.mvec[idx] = f;
        ret
    }
}

// basis vectors are available as global constants.
${basis.slice(1).map((x,i)=>`const ${x}: ${classname} = ${classname}::new(1.0, ${i+1});`).join('\n')}

impl Index<usize> for ${classname} {
    type Output = float_t;

    fn index<'a>(&'a self, index: usize) -> &'a Self::Output {
        &self.mvec[index]
    }
}

impl IndexMut<usize> for ${classname} {
    fn index_mut<'a>(&'a mut self, index: usize) -> &'a mut Self::Output {
        &mut self.mvec[index]
    }
}

impl fmt::Display for ${classname} {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let mut n = 0;
        let ret = self.mvec.iter().enumerate().filter_map(|(i, &coeff)| {
            if coeff > 0.00001 || coeff < -0.00001 {
                n = 1;
                Some(format!("{}{}", 
                        format!("{:.*}", 7, coeff).trim_end_matches('0').trim_end_matches('.'),
                        if i > 0 { basis[i] } else { "" }
                    )
                )
            } else {
                None
            }
        }).collect::<Vec<String>>().join(" + ");
        if n==0 { write!(f,"0") } else { write!(f, "{}", ret) }
    }
}`;

// rust Template for our binary operators

var binary = (classname, symbol, name, name_a, name_b, name_ret, code, classname_a = classname, classname_b = classname, desc) => {

  let body = ``;

  if (symbol) {

    if (name.match(/^s/)) {
      body = `impl ${{ "+": "Add", "*": "Mul" }[symbol] || name}<${classname}> for float_t {
    type Output = ${classname};

    fn ${{ "+": "add", "*": "mul" }[symbol] || name}(self: float_t, b: ${classname}) -> ${classname} {
        let mut ${name_ret} = ${classname}::zero();
        let ${name_a} = self;
        ${code.replace(/^ */g, '').replace(/\n */g, '\n        ')}
        ${name_ret}
    }
}`;
    } else if (name.match(/s$/)) {
      body = `impl ${{ "+": "Add", "*": "Mul" }[symbol] || name}<float_t> for ${classname} {
    type Output = ${classname};

    fn ${{ "+": "add", "*": "mul" }[symbol] || name}(self: ${classname}, b: float_t) -> ${classname} {
        let mut ${name_ret} = ${classname}::zero();
        let ${name_a} = self;
        ${code.replace(/^ */g, '').replace(/\n */g, '\n        ')}
        ${name_ret}
    }
    }`;
    } else {
      body = `impl ${{ "+": "Add", "*": "Mul", "^": "BitXor", "&": "BitAnd", "|": "BitOr" }[symbol] || name} for ${classname} {
    type Output = ${classname};

    fn ${{ "+": "add", "-": "sub", "*": "mul", "^": "bitxor", "&": "bitand", "|": "bitor" }[symbol] || name}(self: ${classname}, b: ${classname}) -> ${classname} {
        let mut ${name_ret} = ${classname}::zero();
        let ${name_a} = self;
        ${code.replace(/^ */g, '').replace(/\n */g, '\n		')}
        ${name_ret}
    }
}`;
    }
  } else {
    // no binary named function yet
    body = ``;
    }

  return `// ${name}
// ${desc}
${body}`;
};

// rust Template for our unary operators
var unary = (classname, symbol, name, name_a, name_ret, code, classname_a = classname, desc) => {
  let body = `impl ${classname} {
    pub fn ${name}(self: Self) -> ${classname} {
        let mut ${name_ret} = ${classname}::zero();
        let ${name_a} = self;
        ${code.replace(/^ */g, '').replace(/\n */g, '\n        ')}
        ${name_ret}
    }
}`;

  if (symbol == `!`) {
    body = `${body}

impl ${{ "!": "Not" }[symbol] || name} for ${classname} {
    type Output = ${classname};

    fn ${{ "!": "not" }[symbol] || name}(self: Self) -> ${classname} {
        let mut ${name_ret} = ${classname}::zero();
        let ${name_a} = self;
        ${code.replace(/^ */g, '').replace(/\n */g, '\n        ')}
        ${name_ret}
    }
}`;
  }

  return `// ${name}
// ${desc}
${body}`;
}

// rust template for CGA
var CGA = (basis,classname)=>({
preamble:`
  pub fn eo() -> Self { e4 + e5 }
  pub fn ei() -> Self { (e5 - e4)*0.5 }
  
  pub fn up(x: float_t, y: float_t, z: float_t) -> Self {
    x*e1 + y*e2 + z*e3 + 0.5*(x*x+y*y+z*z)*Self::ei() + Self::eo()
  }
`,
amble:`
    let px = ${classname}::up(1.0,2.0,3.0);
    let line = px ^ ${classname}::eo() ^ ${classname}::ei();
    let sphere = (${classname}::eo() - ${classname}::ei()).Dual();
    println!("a point       : {}", px);
    println!("a line        : {}", line);
    println!("a sphere      : {}", sphere);
  
`
})

// rust template for algebras without examples
var GENERIC = (basis,classname)=>({
preamble:``,
amble:`
  println!("${basis[1]}*${basis[1]}         : {}", ${basis[1]} * ${basis[1]});
  println!("pss           : {}", ${basis[basis.length-1]});
  println!("pss*pss       : {}", ${basis[basis.length-1]}*${basis[basis.length-1]});
`
})

// rust template for PGA
var PGA3D = (basis,classname)=>({
preamble:`
    // A rotor (Euclidean line) and translator (Ideal line)
    pub fn rotor(angle: float_t, line: Self) -> Self {
        (angle / 2.0).cos() + (angle / 2.0).sin() * line.normalized()
    }

    pub fn translator(dist: float_t, line: Self) -> Self {
        1.0 + dist / 2.0 * line
    }

    // A plane is defined using its homogenous equation ax + by + cz + d = 0
    pub fn plane(a: float_t, b: float_t, c:float_t, d:float_t) -> Self {
        a * e1 + b * e2 + c * e3 + d * e0
    }

    // PGA lines are bivectors.
    pub fn e01() -> Self { e0^e1 } 
    pub fn e02() -> Self { e0^e2 }
    pub fn e03() -> Self { e0^e3 }
    pub fn e12() -> Self { e1^e2 } 
    pub fn e31() -> Self { e3^e1 }
    pub fn e23() -> Self { e2^e3 }

    // PGA points are trivectors.
    pub fn e123() -> Self { e1^e2^e3 }
    pub fn e032() -> Self { e0^e3^e2 }
    pub fn e013() -> Self { e0^e1^e3 }
    pub fn e021() -> Self { e0^e2^e1 }

    // A point is just a homogeneous point, euclidean coordinates plus the origin
    pub fn point(x: float_t, y: float_t, z:float_t) -> Self {
         Self::e123() + x * Self::e032() + y * Self::e013() + z * Self::e021()
    }

    // for our toy problem (generate points on the surface of a torus)
    // we start with a function that generates motors.
    // circle(t) with t going from 0 to 1.
    pub fn circle(t: float_t, radius: float_t, line: Self) -> Self {
        Self::rotor(t * 2.0 * PI, line) * Self::translator(radius, e1 * e0)
    }

    // a torus is now the product of two circles.
    pub fn torus(s: float_t, t: float_t, r1: float_t, l1: Self, r2: float_t, l2: Self) -> Self {
        Self::circle(s, r2, l2) * Self::circle(t, r1, l1)
    }

    // and to sample its points we simply sandwich the origin ..
    pub fn point_on_torus(s: float_t, t: float_t) -> Self {
        let to: Self = Self::torus(s, t, 0.25, Self::e12(), 0.6, Self::e31());

        to * Self::e123() * to.Reverse()
    }

`,
amble:`
    // Elements of the even subalgebra (scalar + bivector + pss) of unit length are motors
    let rot = ${classname}::rotor(PI / 2.0, e1 * e2);

    // The outer product ^ is the MEET. Here we intersect the yz (x=0) and xz (y=0) planes.
    let ax_z = e1 ^ e2;
    
    // line and plane meet in point. We intersect the line along the z-axis (x=0,y=0) with the xy (z=0) plane.
    let orig = ax_z ^ e3;
    
    // We can also easily create points and join them into a line using the regressive (vee, &) product.
    let px = ${classname}::point(1.0, 0.0, 0.0);
    let line = orig & px;
    
    // Lets also create the plane with equation 2x + z - 3 = 0
    let p = ${classname}::plane(2.0, 0.0, 1.0, -3.0);
    
    // rotations work on all elements
    let rotated_plane = rot * p * rot.Reverse();
    let rotated_line  = rot * line * rot.Reverse();
    let rotated_point = rot * px * rot.Reverse();
    
    // See the 3D PGA Cheat sheet for a huge collection of useful formulas
    let point_on_plane = (p | px) * p;

    // Some output
    println!("a point       : {}", px);
    println!("a line        : {}", line);
    println!("a plane       : {}", p);
    println!("a rotor       : {}", rot);
    println!("rotated line  : {}", rotated_line);
    println!("rotated point : {}", rotated_point);
    println!("rotated plane : {}", rotated_plane);
    println!("point on plane: {}", point_on_plane.normalized());
    println!("point on torus: {}", ${classname}::point_on_torus(0.0, 0.0));
`});

// rust Template for the postamble
var postamble = (basis,classname,example) =>
  `impl ${classname} {
    pub fn norm(self: Self) -> float_t {
        let scalar_part = (self * self.Conjugate())[0];

        scalar_part.abs().sqrt()
    }

    pub fn inorm(self: Self) -> float_t {
        self.Dual().norm()
    }

    pub fn normalized(self: Self) -> Self {
        self * (1.0 / self.norm())
    }
    
    ${example.preamble}

}


fn main() {
${example.amble}
}`;

Object.assign(exports,{preamble,postamble,unary,binary,desc:"rust",PGA3D,CGA,GENERIC});
